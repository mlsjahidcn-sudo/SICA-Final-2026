---
name: Fix Individual Application Status Bug
overview: Fix a bug in admin application detail page where status change always uses individual-applications endpoint, even for partner applications.
todos:
  - id: fix-status-change-endpoint
    content: 修复 handleStatusChange 函数 - 根据申请类型调用正确的状态更新端点
    status: completed
  - id: add-isIndividual-state
    content: 添加 isIndividual 状态变量并在使用处更新
    status: completed
  - id: fix-refresh-logic
    content: 修复刷新逻辑 - 根据申请类型调用正确的端点
    status: completed
  - id: verify-typescript
    content: 验证 TypeScript 编译
    status: completed
    dependencies:
      - fix-status-change-endpoint
      - add-isIndividual-state
      - fix-refresh-logic
---

## 问题分析

在管理员申请详情页面 `src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx` 中发现以下bug：

**Bug 1: handleStatusChange 函数始终调用 individual-applications 端点**

- 第183行：`fetch('/api/admin/individual-applications/${appId}/status'...)`
- 第191行：`fetch('/api/admin/individual-applications?id=${appId}'...)`
- 即使是合作伙伴申请也会调用个人申请端点，导致403错误

**Bug 2: 缺少 isIndividual 状态追踪**

- 页面在获取数据时判断了 isIndividual，但没有保存该值供后续使用
- 需要添加状态变量来跟踪申请类型

## 修复方案

1. 添加 `isIndividual` 状态变量保存申请类型
2. 在 `handleStatusChange` 中根据申请类型调用正确的端点
3. 在刷新数据时也使用正确的端点

## 预期效果

修复后，个人申请和合作伙伴申请的状态更改都能正常工作

## 技术方案

- **修改文件**: `src/app/admin/(admin-v2)/v2/applications/[id]/page.tsx`
- **修改内容**:

1. 添加 `const [isIndividual, setIsIndividual] = useState<boolean>(true);` 状态变量
2. 在数据获取成功后设置 `setIsIndividual(isIndividualApp);`
3. 修改 `handleStatusChange` 函数，根据 `isIndividual` 调用正确的API端点
4. 修改刷新逻辑，根据 `isIndividual` 调用正确的端点