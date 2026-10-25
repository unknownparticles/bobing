# 红釉金纹 3D 博饼碗实施计划

**目标：** 按用户确认范围实现首页、对局共用的红釉金纹真 3D 碗和立体骰子。

**架构：** DiceBowl 保留外部 props，内部懒加载独立 React canvas 组件。场景构建、纹理生成与骰子姿态各自独立；规则不依赖 Three.js。按现有工作区实施，保留其他任务尚未提交的文件。

**技术：** React、Three.js、CanvasTexture、现有 Vite/Vitest 与 Playwright。

- [x] 添加临时姿态测试，覆盖六种点数朝上、4–8 骰不越界、局部重投和减少动态效果；先确认缺失实现的失败，再实现独立姿态函数。
- [x] 新增 `src/scene/bowl3d/`：`dice-pose.js` 处理姿态，`textures.js` 生成金纹与骰面，`create-scene.js` 创建碗体/骰子/灯光与释放资源，`BowlCanvas.jsx` 管理生命周期、尺寸及动画。
- [x] 修改 `src/ui/PaperPrimitives.jsx` 接入懒加载场景，新增 `src/styles/bowl3d.css` 负责容器与静态红金回退，补充 WebGL 不可用和资源清理的临时组件检查。
- [x] 使用 Node 22 以上运行现有测试和生产构建，用技能客户端与浏览器验证真实对局和独立状态组合，查看截图并修正画面。
- [x] 按用户要求删除本次临时测试和预览入口，保存验收截图、验证记录，更新 progress.md；复查最终构建与变更。
