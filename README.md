# High Fidelity Showroom

网页端单间样板房实时 3D 原型；旧有双层 CAD 户型、楼层切换和参数化平面结构已移除，当前只保留一个独立现代主卧样板间。

## 技术栈

- Three.js 0.185.1
- WebGL2 + PBR / MeshPhysicalMaterial
- ACES Filmic tone mapping + sRGB 输出
- PMREM + RoomEnvironment 室内 IBL
- PCF Soft Shadow，桌面主方向光 4096×4096 阴影贴图
- 两组 2048×2048 局部聚光灯阴影
- RectAreaLight 窗口补光与吊顶氛围光
- Vite 8.2.2 构建与 GitHub Pages 自动部署

## 场景

单间尺寸约为 6.8 × 5.4 × 3.1 m，程序化建立墙体、真实窗洞、玻璃窗、吊顶、木地板、软包背景墙、木格栅、床架、床垫、被褥、抱枕、床头柜、台灯、窗帘、休闲椅、边几、电视柜、艺术画与绿植。

## 阴影与画质

桌面端默认 Ultra：主太阳光使用 4096px PCF Soft Shadow，局部灯具使用最高 2048px 阴影贴图，并辅以程序化接触阴影以强化家具落地感；移动端自动降低部分阴影分辨率和 DPR，以降低显存压力。

## 操作

- WASD：移动
- Shift：加速
- 鼠标点击/拖动：观察
- R：复位视角
- 移动端：左侧虚拟摇杆移动，右侧区域拖动观察

## 本地运行

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```
