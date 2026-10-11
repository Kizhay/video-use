#!/usr/bin/env python3
"""Маска человека по кадрам (Robust Video Matting, ONNX, на CPU).

  python3 person_mask.py VIDEO OUT_DIR [--model rvm.onnx] [--max-side 640] [--fps 30]

Пишет OUT_DIR/alpha.u8 (кадры подряд, uint8 0..255, размер w x h) и OUT_DIR/alpha.json
({"w","h","frames","fps","src_w","src_h"}). Маска считается в уменьшенном размере
(по длинной стороне --max-side), это быстро; effects.py растягивает её до размера кадра.
Модель помнит предыдущие кадры (рекуррентные состояния), поэтому край не дрожит.
Скачать модель: https://github.com/PeterL1n/RobustVideoMatting/releases (rvm_mobilenetv3_fp32.onnx, 15 МБ).
"""
import argparse, json, os, subprocess, sys, time, urllib.request
import numpy as np

MODEL_URL = 'https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx'


def probe(path):
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate:stream_side_data=rotation', '-of', 'json', path],
                         capture_output=True, text=True, check=True).stdout
    s = json.loads(out)['streams'][0]
    w, h = int(s['width']), int(s['height'])
    rot = 0
    for sd in s.get('side_data_list', []) or []:
        rot = int(sd.get('rotation', 0) or 0)
    if abs(rot) % 180 == 90:
        w, h = h, w
    return w, h


def ensure_model(path):
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, path)
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('video'); ap.add_argument('out_dir')
    ap.add_argument('--model', default=os.path.expanduser('~/.cache/rvm/rvm_mobilenetv3_fp32.onnx'))
    ap.add_argument('--max-side', type=int, default=640)
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--threads', type=int, default=0)
    a = ap.parse_args()
    import onnxruntime as ort
    so = ort.SessionOptions()
    if a.threads: so.intra_op_num_threads = a.threads
    sess = ort.InferenceSession(ensure_model(a.model), so, providers=['CPUExecutionProvider'])

    sw, sh = probe(a.video)
    k = min(1.0, a.max_side / max(sw, sh))
    w, h = int(round(sw * k / 2)) * 2, int(round(sh * k / 2)) * 2
    ratio = np.array([0.25 if max(w, h) > 480 else 0.5], dtype=np.float32)
    os.makedirs(a.out_dir, exist_ok=True)
    dec = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', a.video, '-vf', f'fps={a.fps},scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                           stdout=subprocess.PIPE, bufsize=10 ** 8)
    rec = [np.zeros((1, 1, 1, 1), np.float32) for _ in range(4)]
    fsz = w * h * 3
    n, t0 = 0, time.time()
    with open(os.path.join(a.out_dir, 'alpha.u8'), 'wb') as fo:
        while True:
            buf = dec.stdout.read(fsz)
            if len(buf) < fsz: break
            src = (np.frombuffer(buf, np.uint8).reshape(h, w, 3).astype(np.float32) / 255.0).transpose(2, 0, 1)[None]
            fgr, pha, *rec = sess.run(None, {'src': src, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ratio})
            fo.write((np.clip(pha[0, 0], 0, 1) * 255).astype(np.uint8).tobytes())
            n += 1
    json.dump({'w': w, 'h': h, 'frames': n, 'fps': a.fps, 'src_w': sw, 'src_h': sh}, open(os.path.join(a.out_dir, 'alpha.json'), 'w'))
    dt = time.time() - t0
    print(json.dumps({'frames': n, 'sec': round(dt, 1), 'fps_processing': round(n / max(dt, 1e-6), 1), 'size': f'{w}x{h}'}))


if __name__ == '__main__':
    main()
