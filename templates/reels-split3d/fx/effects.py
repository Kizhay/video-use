#!/usr/bin/env python3
"""Эффекты, «приклеенные» к человеку в видео: по маске из person_mask.py.

  python3 effects.py VIDEO MASK_DIR SPEC.json OUT.mp4

SPEC.json: {"fx": [ {...}, ... ]}, у каждого эффекта "start" и "end" (секунды) и "type":
  bg            смена фона вокруг человека: mode = blur | color | gradient | image | video;
                value = "#RRGGBB" (color), ["#A","#B"] (gradient, сверху вниз), путь (image/video), blur = сила (по умолчанию 41)
  text_behind   текст МЕЖДУ фоном и человеком (человек перекрывает буквы): text, font (путь .ttf/.otf),
                size, color, x, y (0..1, центр текста), anim = rise | pop | fade
  outline       светящийся контур по краю силуэта, который двигается вместе с человеком:
                color, width, glow, style = solid | pulse | rainbow
  sticker_outline  белая «вырезная» обводка силуэта как у стикера: color, width
  head_circle   голова в круге (вырезка по маске) в углу кадра: corner = tl|tr|bl|br, size, ring, ring_width, bg
  sticker       картинка/иконка (PNG с прозрачностью), прилипшая к голове/плечу и двигающаяся с ним:
                image, anchor = head_top | head_left | head_right | shoulder_l | shoulder_r | chest,
                size (px), dx, dy, anim = pop | bounce | none
Порядок слоёв: фон -> текст за человеком -> человек -> контур/обводка -> круг с головой -> стикеры.
Звук берётся из исходного видео без перекодирования.
"""
import json, math, os, subprocess, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw, ImageFont


def hex_bgr(c):
    c = c.lstrip('#')
    return (int(c[4:6], 16), int(c[2:4], 16), int(c[0:2], 16))


def ease_out_back(x, s=1.7):
    x = min(1.0, max(0.0, x)); return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def ease_out_cubic(x):
    x = min(1.0, max(0.0, x)); return 1 - (1 - x) ** 3


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,r_frame_rate:stream_side_data=rotation', '-of', 'json', path], capture_output=True, text=True, check=True).stdout
    s = json.loads(out)['streams'][0]
    w, h = int(s['width']), int(s['height'])
    rot = 0
    for sd in s.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    if abs(rot) % 180 == 90: w, h = h, w
    n, d = s['r_frame_rate'].split('/')
    return w, h, float(n) / float(d)


def overlay_rgba(dst, rgba, x, y):
    """Кладёт RGBA (uint8, BGRA) на BGR dst в точку левого верхнего угла (x, y), с обрезкой по краям."""
    H, W = dst.shape[:2]; h, w = rgba.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(W, x + w), min(H, y + h)
    if x0 >= x1 or y0 >= y1: return
    sub = rgba[y0 - y:y1 - y, x0 - x:x1 - x]
    a = sub[:, :, 3:4].astype(np.float32) / 255.0
    dst[y0:y1, x0:x1] = (dst[y0:y1, x0:x1] * (1 - a) + sub[:, :, :3] * a).astype(np.uint8)


def load_rgba(path, size=None):
    im = Image.open(path).convert('RGBA')
    if size:
        r = size / max(im.size); im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
    arr = np.array(im)
    return cv2.cvtColor(arr, cv2.COLOR_RGBA2BGRA)


def text_layer(text, font, size, color, W, H):
    f = ImageFont.truetype(font, size)
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    lines = text.split('\n'); lh = int(size * 1.05)
    y = (H - lh * len(lines)) // 2
    c = tuple(int(color.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
    for ln in lines:
        tw = d.textlength(ln, font=f); d.text(((W - tw) / 2, y), ln, font=f, fill=c); y += lh
    return cv2.cvtColor(np.array(im), cv2.COLOR_RGBA2BGRA)


class Anchors:
    """Точки на человеке по маске: макушка, ширина головы, плечи. Сглаживаются во времени."""
    def __init__(self): self.s = None

    def update(self, a):
        H, W = a.shape; m = a > 0.5
        # главный человек — самая большая связная область (на общем плане их может быть двое)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
        if n > 2:
            big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = lab == big
        rows = np.where(m.any(axis=1))[0]
        if len(rows) < 10: return self.s
        top, bot = rows[0], rows[-1]; ph = max(1, bot - top)
        def span(y):
            y = int(min(H - 1, max(0, y))); xs = np.where(m[y])[0]
            return (xs[0], xs[-1]) if len(xs) else (W // 2, W // 2)
        hy = top + int(0.10 * ph); l, r = span(hy)
        # ширина головы — по строке чуть ниже макушки; плечи — по строке на 38% высоты
        sy = top + int(0.38 * ph); sl, sr = span(sy)
        cx = (l + r) / 2; hw = max(20, r - l)
        cur = dict(top=float(top), cx=float(cx), hw=float(hw), sy=float(sy), sl=float(sl), sr=float(sr), bot=float(bot), ph=float(ph))
        if self.s is None: self.s = cur
        else:
            k = 0.45
            for key in cur: self.s[key] = self.s[key] * (1 - k) + cur[key] * k
        return self.s


def main():
    video, mdir, spec_path, out = sys.argv[1:5]
    spec = json.load(open(spec_path)); fx = spec['fx']
    meta = json.load(open(os.path.join(mdir, 'alpha.json'))); mw, mh, nfr = meta['w'], meta['h'], meta['frames']
    alpha = np.memmap(os.path.join(mdir, 'alpha.u8'), dtype=np.uint8, mode='r', shape=(nfr, mh, mw))
    W, H, fps = probe(video)
    anchors = Anchors()
    cache = {}
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', video, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE, bufsize=10 ** 8)
    enc = subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-', '-i', video,
                            '-map', '0:v', '-map', '1:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    fsz = W * H * 3; i = 0
    vcap = {}
    LUT = np.clip((np.arange(256) / 255.0 - 0.12) / 0.76, 0, 1).__mul__(255).astype(np.uint8)
    while True:
        buf = dec.stdout.read(fsz)
        if len(buf) < fsz: break
        t = i / fps
        frame = np.frombuffer(buf, np.uint8).reshape(H, W, 3).copy()
        ai = min(nfr - 1, int(round(t * meta['fps'])))
        a_small = alpha[ai].astype(np.float32) / 255.0
        a8 = cv2.LUT(cv2.resize(np.ascontiguousarray(alpha[ai]), (W, H), interpolation=cv2.INTER_LINEAR), LUT)   # чуть подтянуть край
        a = a8   # uint8 0..255
        anc = anchors.update(a_small)
        sc = W / mw
        act = [e for e in fx if e['start'] <= t < e['end']]
        # --- фон ---
        bg = frame
        for e in act:
            if e['type'] != 'bg': continue
            mode = e.get('mode', 'blur')
            if mode == 'blur':
                k = int(e.get('blur', 41)) | 1; bg = cv2.GaussianBlur(frame, (k, k), 0)
                if e.get('dim'): bg = (bg * float(e['dim'])).astype(np.uint8)
            elif mode == 'color':
                bg = np.empty_like(frame); bg[:] = hex_bgr(e['value'])
            elif mode == 'gradient':
                key = ('g', e['value'][0], e['value'][1])
                if key not in cache:
                    c0, c1 = np.array(hex_bgr(e['value'][0]), np.float32), np.array(hex_bgr(e['value'][1]), np.float32)
                    ramp = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
                    cache[key] = np.broadcast_to((c0 * (1 - ramp) + c1 * ramp), (H, W, 3)).astype(np.uint8)
                bg = cache[key].copy()
            elif mode == 'image':
                key = ('i', e['value'])
                if key not in cache:
                    im = cv2.imread(e['value']); r = max(W / im.shape[1], H / im.shape[0])
                    im = cv2.resize(im, (int(im.shape[1] * r) + 1, int(im.shape[0] * r) + 1)); y0, x0 = (im.shape[0] - H) // 2, (im.shape[1] - W) // 2
                    cache[key] = im[y0:y0 + H, x0:x0 + W].copy()
                bg = cache[key].copy()
            elif mode == 'video':
                cap = vcap.get(e['value']) or cv2.VideoCapture(e['value']); vcap[e['value']] = cap
                ok, im = cap.read()
                if not ok:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, 0); ok, im = cap.read()
                if ok:
                    r = max(W / im.shape[1], H / im.shape[0]); im = cv2.resize(im, (int(im.shape[1] * r) + 1, int(im.shape[0] * r) + 1))
                    y0, x0 = (im.shape[0] - H) // 2, (im.shape[1] - W) // 2; bg = im[y0:y0 + H, x0:x0 + W].copy()
        bg = bg.copy()
        # --- текст за человеком ---
        for e in act:
            if e['type'] != 'text_behind': continue
            key = ('t', e['text'], e['font'], e.get('size', 380), e.get('color', '#FFFFFF'))
            if key not in cache: cache[key] = text_layer(e['text'], e['font'], int(e.get('size', 380)), e.get('color', '#FFFFFF'), W, int(e.get('size', 380) * 1.15 * (e['text'].count('\n') + 1)))
            lay = cache[key]; lt = (t - e['start']); anim = e.get('anim', 'rise'); a_in = ease_out_cubic(lt / 0.5)
            dy = int((1 - ease_out_cubic(lt / 0.6)) * 160) if anim == 'rise' else 0
            L = lay.copy()
            if anim in ('fade', 'rise'): L[:, :, 3] = (L[:, :, 3] * a_in).astype(np.uint8)
            if anim == 'pop':
                s = 0.6 + 0.4 * ease_out_back(lt / 0.45); L = cv2.resize(lay, None, fx=s, fy=s)
            ty = int(e.get('y', 0.35) * H - L.shape[0] / 2 + dy); tx = int(e.get('x', 0.5) * W - L.shape[1] / 2)
            overlay_rgba(bg, L, tx, ty)
        # --- человек поверх фона ---
        a3 = cv2.merge([a8, a8, a8])
        if any(e['type'] in ('bg', 'text_behind') for e in act):
            comp = cv2.add(cv2.multiply(bg, cv2.bitwise_not(a3), scale=1 / 255.0), cv2.multiply(frame, a3, scale=1 / 255.0))
        else:
            comp = frame.copy()
        # --- контур / обводка ---
        for e in act:
            if e['type'] == 'outline':
                wd = max(1, int(e.get('width', 8)) // 2); glow = (int(e.get('glow', 26)) // 2) | 1
                half = cv2.resize(a8, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
                _, m8 = cv2.threshold(half, 127, 255, cv2.THRESH_BINARY)
                k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (wd * 2 + 1, wd * 2 + 1))
                ring = cv2.subtract(cv2.dilate(m8, k), m8)
                style = e.get('style', 'pulse'); lt = t - e['start']
                if style == 'rainbow':
                    hue = int((lt * 120) % 180); col = cv2.cvtColor(np.uint8([[[hue, 255, 255]]]), cv2.COLOR_HSV2BGR)[0, 0]; col = tuple(int(c) for c in col)
                else: col = hex_bgr(e.get('color', '#00E5FF'))
                pulse = 0.75 + 0.25 * math.sin(lt * 6) if style == 'pulse' else 1.0
                g = cv2.GaussianBlur(ring, (glow, glow), 0)
                layer = cv2.add(cv2.convertScaleAbs(g, alpha=1.8 * pulse), ring)          # свечение + чёткая линия
                layer = cv2.resize(layer, (W, H), interpolation=cv2.INTER_LINEAR)
                l3 = cv2.merge([layer, layer, layer])
                colimg = np.empty_like(comp); colimg[:] = col
                comp = cv2.add(cv2.multiply(comp, cv2.bitwise_not(l3), scale=1 / 255.0), cv2.multiply(colimg, l3, scale=1 / 255.0))
            elif e['type'] == 'sticker_outline':
                wd = max(1, int(e.get('width', 14)) // 2)
                half = cv2.resize(a8, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
                _, m8 = cv2.threshold(half, 127, 255, cv2.THRESH_BINARY)
                k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (wd * 2 + 1, wd * 2 + 1))
                halo = cv2.GaussianBlur(cv2.subtract(cv2.dilate(m8, k), m8), (3, 3), 0)
                halo = cv2.resize(halo, (W, H), interpolation=cv2.INTER_LINEAR)
                l3 = cv2.merge([halo, halo, halo]); colimg = np.empty_like(comp); colimg[:] = hex_bgr(e.get('color', '#FFFFFF'))
                comp = cv2.add(cv2.multiply(comp, cv2.bitwise_not(l3), scale=1 / 255.0), cv2.multiply(colimg, l3, scale=1 / 255.0))
        # --- голова в круге ---
        for e in act:
            if e['type'] != 'head_circle' or anc is None: continue
            size = int(e.get('size', 300)); lt = t - e['start']; s = ease_out_back(lt / 0.5)
            hw = anc['hw'] * sc; cx = anc['cx'] * sc; cy = (anc['top'] * sc) + hw * 0.62
            half = int(hw * 0.85)
            x0, y0 = int(cx) - half, int(cy) - half
            pad = np.zeros((2 * half, 2 * half, 3), np.uint8); pad[:] = hex_bgr(e.get('bg', '#14161C'))
            xs0, ys0, xs1, ys1 = max(0, x0), max(0, y0), min(W, x0 + 2 * half), min(H, y0 + 2 * half)
            crop = frame[ys0:ys1, xs0:xs1]; ac = a8[ys0:ys1, xs0:xs1, None].astype(np.float32) / 255.0
            pad[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] = (pad[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0] * (1 - ac) + crop * ac).astype(np.uint8) if e.get('cutout', True) else crop
            disc = cv2.resize(pad, (size, size), interpolation=cv2.INTER_AREA)
            mask = np.zeros((size, size), np.uint8); cv2.circle(mask, (size // 2, size // 2), size // 2 - 2, 255, -1, cv2.LINE_AA)
            rw = int(e.get('ring_width', 10)); ring_c = hex_bgr(e.get('ring', '#FFD60A'))
            rgba = np.dstack([disc, mask]); cv2.circle(rgba, (size // 2, size // 2), size // 2 - 2 - rw // 2, ring_c + (255,), rw, cv2.LINE_AA)
            sz = max(2, int(size * s)); rgba = cv2.resize(rgba, (sz, sz), interpolation=cv2.INTER_AREA)
            m = int(e.get('margin', 40)); cor = e.get('corner', 'tr')
            px = m if cor in ('tl', 'bl') else W - sz - m; py = m + int(e.get('top', 120)) if cor in ('tl', 'tr') else H - sz - m - int(e.get('bottom', 360))
            overlay_rgba(comp, rgba, px + (size - sz) // 2, py + (size - sz) // 2)
        # --- стикеры, приклеенные к человеку ---
        for e in act:
            if e['type'] != 'sticker' or anc is None: continue
            key = ('s', e['image'], int(e.get('size', 180)))
            if key not in cache: cache[key] = load_rgba(e['image'], int(e.get('size', 180)))
            im = cache[key]; lt = t - e['start']; anim = e.get('anim', 'pop')
            s = ease_out_back(lt / 0.4) if anim in ('pop', 'bounce') else 1.0
            if anim == 'bounce': s *= 1 + 0.06 * math.sin(lt * 7)
            ax = {'head_top': (anc['cx'], anc['top'] - 0.0), 'head_left': (anc['cx'] - anc['hw'] * 0.75, anc['top'] + anc['hw'] * 0.5),
                  'head_right': (anc['cx'] + anc['hw'] * 0.75, anc['top'] + anc['hw'] * 0.5), 'shoulder_l': (anc['sl'], anc['sy']),
                  'shoulder_r': (anc['sr'], anc['sy']), 'chest': (anc['cx'], anc['sy'] + 0.10 * anc['ph'])}[e.get('anchor', 'head_top')]
            px, py = ax[0] * sc + e.get('dx', 0), ax[1] * sc + e.get('dy', -20)
            sz = (max(2, int(im.shape[1] * s)), max(2, int(im.shape[0] * s)))
            rim = cv2.resize(im, sz, interpolation=cv2.INTER_AREA)
            rot = e.get('tilt', 0)
            if rot:
                M = cv2.getRotationMatrix2D((sz[0] / 2, sz[1] / 2), rot, 1.0); rim = cv2.warpAffine(rim, M, sz, flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
            overlay_rgba(comp, rim, int(px - sz[0] / 2), int(py - sz[1] / 2 - (sz[1] * 0.5 if e.get('anchor', 'head_top') == 'head_top' else 0)))
        enc.stdin.write(comp.tobytes()); i += 1
    enc.stdin.close(); enc.wait(); dec.wait()
    print(json.dumps({'frames': i, 'out': out}))


if __name__ == '__main__':
    main()
