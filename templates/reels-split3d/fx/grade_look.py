#!/usr/bin/env python3
"""Цветокор «как в CapCut»: те же ползунки (−100…+100, 0 = без изменений), один файл настроек → .cube-LUT.

  python3 grade_look.py list                                   # готовые стили
  python3 grade_look.py bake STYLE OUT.cube [--params '{"contrast":15}'] [--strength 0.8] [--size 33]
  python3 grade_look.py video IN OUT.mp4 [--look STYLE] [--params JSON|файл.json] [--auto] [--strength 1]
                         [--mask MASK_DIR --bg-look STYLE]     # человек и фон — разные стили (маска из fx/person_mask.py)
  python3 grade_look.py sheet IN OUT.png --look clean,warm,cinematic    # лист «до/после» для сравнения стилей
  python3 grade_look.py auto IN                                 # автоподбор: напечатает параметры по самому видео

Ползунки (как в панели «Настройка» CapCut): exposure, brightness, contrast, highlights, shadows, whites, blacks,
brilliance, temp, tint, saturation, vibrance, hue (градусы), fade, grain, sharpen, clarity, vignette,
split {shadows:{h,s}, highlights:{h,s}, balance}, hsl {red|orange|yellow|green|aqua|blue|purple|magenta: {h,s,l}}.
Всё, что считается цветом (всё, кроме sharpen/clarity/vignette/grain), запекается в один .cube — его можно
загрузить в CapCut (Настройка → LUT → Импорт), DaVinci Resolve и Premiere: на экране получится тот же цвет, что у нас.
ВАЖНО: формулы ползунков наши, не копия CapCut (у CapCut они закрыты): числа «+20 экспозиции» в CapCut и здесь
дают похожий, но не побитово одинаковый результат.
"""
import argparse, json, math, os, subprocess, sys
import numpy as np

HUES = {'red': 0, 'orange': 30, 'yellow': 60, 'green': 120, 'aqua': 180, 'blue': 225, 'purple': 270, 'magenta': 315}

PRESETS = {
    'clean':      {'contrast': 6, 'saturation': 4, 'highlights': -6, 'shadows': 6, 'sharpen': 12},
    'warm':       {'temp': 22, 'tint': 3, 'contrast': 8, 'saturation': 8, 'highlights': -8, 'shadows': 8, 'vignette': 12},
    'cool':       {'temp': -22, 'tint': -3, 'contrast': 10, 'saturation': 2, 'highlights': -6, 'shadows': 4},
    'vivid':      {'contrast': 18, 'saturation': 22, 'vibrance': 20, 'highlights': -10, 'shadows': 12, 'blacks': -6, 'sharpen': 22},
    'cinematic':  {'contrast': 18, 'saturation': -6, 'highlights': -14, 'shadows': 4, 'blacks': -4, 'fade': 8, 'vignette': 22, 'grain': 8,
                   'split': {'shadows': {'h': 195, 's': 22}, 'highlights': {'h': 32, 's': 18}, 'balance': 0}},
    'moody':      {'exposure': -12, 'contrast': 28, 'saturation': -10, 'highlights': -18, 'shadows': -6, 'blacks': -10, 'vignette': 30,
                   'split': {'shadows': {'h': 215, 's': 18}, 'highlights': {'h': 40, 's': 10}, 'balance': 0}},
    'golden':     {'temp': 30, 'tint': 6, 'exposure': 6, 'contrast': 12, 'saturation': 14, 'highlights': -12, 'shadows': 12,
                   'split': {'shadows': {'h': 20, 's': 14}, 'highlights': {'h': 45, 's': 20}, 'balance': 0}},
    'pastel':     {'contrast': -12, 'saturation': -8, 'fade': 22, 'exposure': 8, 'shadows': 18, 'highlights': -6, 'temp': 4},
    'bw':         {'saturation': -100, 'contrast': 24, 'highlights': -8, 'shadows': 8, 'blacks': -8, 'grain': 10, 'vignette': 14},
    'blogger':    {'exposure': 6, 'contrast': 12, 'saturation': 10, 'vibrance': 14, 'highlights': -10, 'shadows': 14, 'temp': 6, 'sharpen': 20, 'clarity': 10,
                   'hsl': {'orange': {'h': 0, 's': -6, 'l': 4}}},
}


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def tone_curve(p, n=1024):
    """Одномерная кривая яркости из ползунков тона. x, y в 0..1."""
    x = np.linspace(0, 1, n)
    y = x.copy()
    ex = p.get('exposure', 0) / 100.0 * 1.5                      # ±100 → ±1,5 EV
    if ex:
        lin = np.power(np.clip(y, 0, 1), 2.2) * (2 ** ex); y = np.power(np.clip(lin, 0, 1.6), 1 / 2.2)
    y = y + p.get('brightness', 0) / 100.0 * 0.20
    bl, wh = p.get('blacks', 0) / 100.0, p.get('whites', 0) / 100.0
    lo, hi = -bl * 0.08, 1 - wh * 0.10                              # чёрные «+» поднимают чёрную точку, белые «+» опускают белую (светлее)
    y = (y - lo) / max(1e-3, hi - lo)
    c = p.get('contrast', 0) / 100.0
    if c > 0:                                                      # S-кривая вокруг середины, сила растёт с ползунком
        k = 1 + 2.2 * c; s = 1 / (1 + np.exp(-k * 4 * (y - 0.5))); s0, s1 = 1 / (1 + np.exp(k * 2)), 1 / (1 + np.exp(-k * 2))
        y = y + ((s - s0) / (s1 - s0) - y) * min(1.0, c)
    elif c < 0:                                                    # плоская кривая: всё ближе к серому
        y = 0.5 + (y - 0.5) * (1 - abs(c) * 0.6)
    h, sh, br = p.get('highlights', 0) / 100.0, p.get('shadows', 0) / 100.0, p.get('brilliance', 0) / 100.0
    wh_w, sh_w = smooth(0.45, 1.0, y), 1 - smooth(0.0, 0.55, y)
    y = y + h * 0.22 * wh_w * (1 - 0.3 * (1 - wh_w)) + (sh + 0.6 * br) * 0.22 * sh_w - 0.6 * br * 0.10 * wh_w
    fd = p.get('fade', 0) / 100.0
    if fd: y = fd * 0.14 + y * (1 - fd * 0.14)
    return x, np.clip(y, 0, 1)


def rgb2hsv(rgb):
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    nz = d > 1e-6
    h = np.where(nz & (mx == r), ((g - b) / np.where(nz, d, 1)) % 6, h)
    h = np.where(nz & (mx == g), (b - r) / np.where(nz, d, 1) + 2, h)
    h = np.where(nz & (mx == b), (r - g) / np.where(nz, d, 1) + 4, h)
    return (h * 60) % 360, np.where(mx > 1e-6, d / np.maximum(mx, 1e-6), 0), mx


def hsv2rgb(h, s, v):
    h = (h % 360) / 60.0; c = v * s; x = c * (1 - np.abs(h % 2 - 1)); m = v - c
    z = np.zeros_like(h); i = np.floor(h).astype(int) % 6
    conds = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    r = np.choose(i, [t[0] for t in conds]); g = np.choose(i, [t[1] for t in conds]); b = np.choose(i, [t[2] for t in conds])
    return np.stack([r + m, g + m, b + m], -1)


def grade_rgb(rgb, p):
    """rgb: float (...,3) 0..1 → то же. Порядок: баланс белого → тон → HSL → насыщенность → тонировка."""
    out = np.clip(rgb.astype(np.float64), 0, 1)
    t, ti = p.get('temp', 0) / 100.0, p.get('tint', 0) / 100.0
    if t or ti:                                                      # усиление каналов: тёплый — больше красного, меньше синего
        gains = np.array([1 + 0.22 * t + 0.08 * ti, 1 - 0.16 * ti, 1 - 0.28 * t + 0.08 * ti]); out = np.clip(out * gains / gains.max() * 1.0, 0, 1) if gains.max() > 1 else out * gains
    x, y = tone_curve(p); out = np.interp(out, x, y)
    hsl = p.get('hsl') or {}
    sat, vib, hue = p.get('saturation', 0) / 100.0, p.get('vibrance', 0) / 100.0, p.get('hue', 0)
    if hsl or sat or vib or hue:
        h, s, v = rgb2hsv(out); s0 = s; wv = smooth(0.02, 0.16, v)      # у самого чёрного цвет шумит — насыщенность там не трогаем
        for name, c in hsl.items():
            sigma = 28.0; d = (h - HUES[name] + 180) % 360 - 180; w = np.exp(-(d / sigma) ** 2) * np.clip(s * 3, 0, 1)
            h = h + w * c.get('h', 0) * 0.3; s = np.clip(s * (1 + w * c.get('s', 0) / 100.0), 0, 1); v = np.clip(v * (1 + w * c.get('l', 0) / 200.0), 0, 1)
        if hue: h = h + hue * wv
        if vib: s = np.clip(s * (1 + vib * (1 - s) * 1.3 * wv), 0, 1)       # сильнее у тусклых цветов, серое остаётся серым
        if sat: s = np.clip(s * (1 + sat * wv), 0, 1)
        out = hsv2rgb(h, s, v)
    sp = p.get('split')
    if sp:
        lum = out @ np.array([0.2126, 0.7152, 0.0722]); bal = sp.get('balance', 0) / 100.0
        ws, wh = 1 - smooth(0.0, 0.6 + bal * 0.2, lum), smooth(0.4 + bal * 0.2, 1.0, lum)
        for key, w in (('shadows', ws), ('highlights', wh)):
            c = sp.get(key)
            if c and c.get('s', 0):
                col = hsv2rgb(np.array(float(c['h'])), np.array(1.0), np.array(1.0))
                out = out + (col - 0.5)[None] * (w[..., None] * c["s"] / 100.0 * 0.85) if out.ndim == 2 else out + (col - 0.5) * (w[..., None] * c["s"] / 100.0 * 0.85)
    return np.clip(out, 0, 1)


def merge(*ps):
    r = {}
    for p in ps:
        for k, v in (p or {}).items():
            if isinstance(v, dict) and isinstance(r.get(k), dict): r[k] = {**r[k], **v}
            else: r[k] = v
    return r


def bake_cube(p, path, size=33, strength=1.0, title='RocketMetrix look'):
    g = np.linspace(0, 1, size)
    B, G, R = np.meshgrid(g, g, g, indexing='ij')                     # .cube: R меняется быстрее всего
    grid = np.stack([R, G, B], -1).reshape(-1, 3)
    res = grade_rgb(grid, p)
    if strength != 1.0: res = grid + (res - grid) * strength
    with open(path, 'w') as f:
        f.write(f'TITLE "{title}"\nLUT_3D_SIZE {size}\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\n')
        np.savetxt(f, res, fmt='%.6f')
    return path


def extras_filters(p):
    fl = []
    if p.get('clarity'): fl.append(f"unsharp=luma_msize_x=21:luma_msize_y=21:luma_amount={p['clarity'] / 100.0 * 1.0:.3f}:chroma_amount=0")
    if p.get('sharpen'): fl.append(f"unsharp=luma_msize_x=5:luma_msize_y=5:luma_amount={p['sharpen'] / 100.0 * 1.5:.3f}:chroma_amount=0")
    if p.get('vignette'): fl.append(f"vignette=angle={math.pi / (5.5 - p['vignette'] / 100.0 * 2.2):.4f}:mode=backward")
    if p.get('grain'): fl.append(f"noise=alls={int(p['grain'] / 100.0 * 22)}:allf=t")
    return fl


def auto_params(video, n=14):
    """Автоподбор по самому видео: чёрная/белая точка, экспозиция к середине, нейтральный баланс по серому миру (в разумных пределах)."""
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video], capture_output=True, text=True).stdout or 0)
    frames = []
    for i in range(n):
        t = dur * (i + 0.5) / n
        raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', video, '-frames:v', '1', '-vf', 'scale=160:-2', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
        if raw: frames.append(np.frombuffer(raw, np.uint8).astype(np.float32) / 255.0)
    if not frames: return {}
    px = np.concatenate([f.reshape(-1, 3) for f in frames]); y = px @ np.array([0.2126, 0.7152, 0.0722])
    p1, p50, p99 = np.percentile(y, [1, 50, 99]); mean = px.mean(0)
    p = {}
    p['blacks'] = int(np.clip((p1 - 0.02) * -250, -25, 20)); p['whites'] = int(np.clip((0.97 - p99) * 220, -20, 25))
    p['exposure'] = int(np.clip((0.46 - p50) * 110, -25, 25))
    gm = mean.mean(); p['temp'] = int(np.clip((mean[0] - mean[2]) / max(gm, 1e-3) * -30, -12, 12)); p['tint'] = int(np.clip((mean[1] - (mean[0] + mean[2]) / 2) / max(gm, 1e-3) * 30, -8, 8))
    hsvs = np.concatenate([rgb2hsv(f.reshape(-1, 3))[1] for f in frames]); ms = float(hsvs.mean())
    p['saturation'] = 8 if ms < 0.25 else (-4 if ms > 0.5 else 0); p['contrast'] = 8 if (p99 - p1) < 0.75 else 3
    return {k: v for k, v in p.items() if v}


def load_params(a):
    p = {}
    if getattr(a, 'look', None): p = merge(p, PRESETS[a.look.split(',')[0]])
    if getattr(a, 'auto', False): p = merge(auto_params(a.input if hasattr(a, 'input') else a.video), p)
    if getattr(a, 'params', None):
        s = a.params; p = merge(p, json.load(open(s)) if os.path.exists(s) else json.loads(s))
    return p


def run_video(a):
    p = load_params(a)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)) or '.', exist_ok=True)
    work = os.path.splitext(a.out)[0] + '_look'; os.makedirs(work, exist_ok=True)
    cube = bake_cube(p, os.path.join(work, 'look.cube'), 65 if p.get('hsl') else 33, a.strength)
    extras = extras_filters(p)
    lut = f"lut3d=file='{cube}':interp=tetrahedral"
    if a.mask and a.bg_look:
        meta = json.load(open(os.path.join(a.mask, 'alpha.json')))
        bgp = merge(PRESETS[a.bg_look], {}); bgcube = bake_cube(bgp, os.path.join(work, 'bg.cube'), 33, 1.0)
        mvid = os.path.join(work, 'mask.mkv')
        w, h = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', a.input], capture_output=True, text=True).stdout.strip().split('x')
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f"{meta['w']}x{meta['h']}", '-r', str(meta['fps']), '-i', os.path.join(a.mask, 'alpha.u8'),
                        '-vf', f'scale={w}:{h},gblur=sigma=1.2,format=gray', '-c:v', 'ffv1', mvid], check=True)
        fc = (f"[0:v]format=yuv444p,split[a][b];[a]{lut},format=yuv444p[fg];[b]lut3d=file='{bgcube}':interp=tetrahedral,format=yuv444p[bg];"
              f"[1:v]format=gray[m];[bg][fg][m]maskedmerge[mm]")
        if extras: fc += ';[mm]' + ','.join(extras) + '[o]'; out_label = '[o]'
        else: out_label = '[mm]'
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', a.input, '-i', mvid, '-filter_complex', fc, '-map', out_label, '-map', '0:a?', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', a.out]
    else:
        vf = ','.join([lut] + extras)
        cmd = ['ffmpeg', '-y', '-v', 'error', '-i', a.input, '-vf', vf, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'copy', a.out]
    subprocess.run(cmd, check=True)
    json.dump(p, open(os.path.join(work, 'params.json'), 'w'), ensure_ascii=False, indent=1)
    print(json.dumps({'out': a.out, 'cube': cube, 'params': p}, ensure_ascii=False))


def run_sheet(a):
    looks = a.look.split(','); tmp = os.path.splitext(a.out)[0] + '_tmp'; os.makedirs(tmp, exist_ok=True)
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.input], capture_output=True, text=True).stdout or 1)
    t = dur * 0.4; tiles = []
    base = os.path.join(tmp, 'orig.png'); subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', a.input, '-frames:v', '1', '-vf', 'scale=-2:480', base], check=True); tiles.append(base)
    for name in looks:
        p = PRESETS[name]; cube = bake_cube(p, os.path.join(tmp, name + '.cube'), 33)
        out = os.path.join(tmp, name + '.png'); vf = ','.join(['scale=-2:480', f"lut3d=file='{cube}':interp=tetrahedral"] + extras_filters(p))
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', a.input, '-frames:v', '1', '-vf', vf, out], check=True); tiles.append(out)
    font = next((f for f in (os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'fonts', 'Jost.ttf'), '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') if os.path.exists(f)), None)
    names = ['до'] + looks; labeled = []
    for i, (t_, nm) in enumerate(zip(tiles, names)):
        lab = os.path.join(tmp, f'lab_{i}.png')
        vf = (f"drawtext=fontfile={font}:text='{nm}':x=10:y=h-th-12:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=8" if font else 'null')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', t_, '-vf', vf, lab], check=True); labeled.append(lab)
    cols = 5; rows = [labeled[i:i + cols] for i in range(0, len(labeled), cols)]
    rowpngs = []
    for ri, row in enumerate(rows):
        rp = os.path.join(tmp, f'row_{ri}.png'); row = row + [row[0]] * (cols - len(row)) if len(rows) > 1 else row
        subprocess.run(['ffmpeg', '-v', 'error', '-y'] + sum([['-i', x] for x in row], []) + ['-filter_complex', ''.join(f'[{i}]' for i in range(len(row))) + f'hstack=inputs={len(row)}', rp], check=True); rowpngs.append(rp)
    if len(rowpngs) == 1: os.replace(rowpngs[0], a.out)
    else: subprocess.run(['ffmpeg', '-v', 'error', '-y'] + sum([['-i', x] for x in rowpngs], []) + ['-filter_complex', ''.join(f'[{i}]' for i in range(len(rowpngs))) + f'vstack=inputs={len(rowpngs)}', a.out], check=True)
    print(a.out, names)


def main():
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    sub.add_parser('list')
    b = sub.add_parser('bake'); b.add_argument('look'); b.add_argument('out'); b.add_argument('--params'); b.add_argument('--strength', type=float, default=1.0); b.add_argument('--size', type=int, default=33)
    v = sub.add_parser('video'); v.add_argument('input'); v.add_argument('out'); v.add_argument('--look'); v.add_argument('--params'); v.add_argument('--auto', action='store_true')
    v.add_argument('--strength', type=float, default=1.0); v.add_argument('--mask'); v.add_argument('--bg-look')
    s = sub.add_parser('sheet'); s.add_argument('input'); s.add_argument('out'); s.add_argument('--look', required=True)
    au = sub.add_parser('auto'); au.add_argument('input')
    a = ap.parse_args()
    if a.cmd == 'list': print(json.dumps({k: v for k, v in PRESETS.items()}, ensure_ascii=False, indent=1))
    elif a.cmd == 'bake':
        p = merge(PRESETS.get(a.look, {}), json.loads(a.params) if a.params else {}); print(bake_cube(p, a.out, a.size, a.strength, a.look))
    elif a.cmd == 'video': run_video(a)
    elif a.cmd == 'sheet': run_sheet(a)
    elif a.cmd == 'auto': print(json.dumps(auto_params(a.input), ensure_ascii=False))


if __name__ == '__main__':
    main()
