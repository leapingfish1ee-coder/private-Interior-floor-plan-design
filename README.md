# Interior Spatial Twin

基于住宅 CAD 截图重建的网页实时 3D 空间原型；当前版本以图纸中可确认的 **11.830 m 横向总尺寸**作为比例锚点，其余局部尺寸按截图比例估算，因此属于方案验证级模型而非施工级 BIM。

## 技术栈

- Three.js 0.185.1
- WebGPURenderer，WebGPU 可用时优先启用，并提供 WebGL2 回退路径
- PBR 材质、ACES Filmic tone mapping、动态软阴影、物理玻璃材质
- Rapier 3D 0.20.0 角色碰撞与墙体静态碰撞体
- Vite 8.2.2 构建与开发服务器
- 桌面 Pointer Lock / 拖拽视角与移动端虚拟摇杆双输入

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

## 当前建模范围

- 1F：LDK、起居/楼梯厅、洗面/家务区、浴室、卫生间/走廊、玄关/鞋帽区。
- 2F：6 帖洋室、2 帖书斋、卫生间/洗面、二层厅/楼梯口、WIC、8.5 帖主卧、南侧连接区。
- 主要墙线、窗体、楼梯、厨房岛台、餐桌椅、沙发、床、柜体与卫浴体块均为程序化几何。

## 尺寸状态

`src/plan.js` 是唯一的平面几何数据源；后续获得原始 PDF、DWG/DXF 或更高清尺寸图后，应优先替换其中的墙段、房间边界、窗体和起始点参数，而无需改动渲染与第一人称控制系统。

## 操作

- `WASD`：移动
- `Shift`：加速
- 鼠标点击画面：请求 Pointer Lock
- 鼠标拖动：Pointer Lock 不可用时仍可观察
- `1 / 2`：切换楼层
- `R`：复位
- 移动端：左侧虚拟摇杆移动，右侧区域拖动观察
