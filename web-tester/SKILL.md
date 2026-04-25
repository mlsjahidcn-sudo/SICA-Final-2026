---
name: web-tester
description: 用于测试网站开发、验证实现、发现Bug并提供修复建议；当用户需要测试API、验证功能模块、检查服务状态、诊断问题或获取改进建议时使用。
---

# Web Tester - Website Testing & Bug Fixer Skill

## 概述

此 Skill 用于系统性测试网站开发成果，包括：
- API 接口测试与验证
- 服务健康检查
- 数据库操作验证
- 模块功能测试
- Bug 检测与根因分析
- 改进建议生成

## 何时使用

**触发条件**（满足任一即触发）：
- 用户说"test my website"、"测试网站"
- 用户说"check this feature"、"检查这个功能"
- 用户说"find bugs"、"发现bug"
- 用户说"validate implementation"、"验证实现"
- 用户说"test module [name]"、"测试模块"
- 用户说"check API"、"检查API"
- 用户说"diagnose issue"、"诊断问题"
- 用户提到"recent changes"、"最近的改动"需要验证
- 开发完成后需要回归测试

## 核心测试流程

### 1. 服务健康检查（必做第一步）

```
1. 检查端口 5000 服务状态
2. 验证 HTTP 响应头
3. 确认服务无崩溃日志
```

执行命令：
```bash
curl -I --max-time 3 http://localhost:5000
```

### 2. API 接口测试

按模块分类测试，优先测试用户请求相关的模块：

| 模块 | 端点示例 | 测试内容 |
|------|----------|----------|
| 认证 | /api/auth/signin, /api/auth/me | 登录、令牌验证、角色检查 |
| 申请 | /api/applications, /api/applications/[id] | CRUD 操作、状态流转 |
| 文档 | /api/documents | 上传、下载、状态更新 |
| 会议 | /api/meetings | 创建、查询、取消 |
| 用户 | /api/student/profile, /api/partner/profile | 资料读取与更新 |
| 管理 | /api/admin/* | 管理员操作、权限验证 |

### 3. 数据库验证

使用 `exec_sql` 工具验证：
- 表结构是否正确
- 数据是否正确写入
- 外键关系是否完整
- RLS 策略是否生效

**重要**：`exec_sql` 可能返回过期数据，关键验证需使用 REST API：
```bash
curl -s "https://{project}.supabase.co/rest/v1/{table}?select=*&limit=1" \
  -H "apikey: {SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer {SERVICE_ROLE_KEY}"
```

### 4. Bug 检测模式

常见 Bug 模式参见 `references/common-bugs.md`：
- 权限控制错误（partner_id vs user_id 混淆）
- 状态流转异常
- 数据类型不匹配
- 必填字段缺失
- N+1 查询问题
- RLS 无限递归

### 5. 日志分析

检查日志文件：
```bash
tail -n 50 /app/work/logs/bypass/app.log | grep -iE "error|exception|warn|traceback"
```

## 测试执行步骤

### Step 1: 确定测试范围

根据用户请求确定：
- 测试哪些模块？
- 测试哪些端点？
- 测试哪些角色权限？

### Step 2: 服务状态检查

```bash
# 检查端口
ss -tuln | grep -E ':5000[[:space:]]' | grep -q LISTEN

# 检查 HTTP 响应
curl -I http://localhost:5000
```

### Step 3: 获取认证令牌

```bash
# 学生登录
curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"student@example.com","password":"Test1234!"}'

# 合作伙伴登录
curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"partner@example.com","password":"Test1234!"}'

# 管理员登录
curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```

### Step 4: 执行 API 测试

使用 `test_run` 工具批量执行测试：
```json
{
  "commands": [
    "curl -s http://localhost:5000/api/applications -H 'Authorization: Bearer $TOKEN'",
    "curl -s -X POST http://localhost:5000/api/applications -H 'Authorization: Bearer $TOKEN' -H 'Content-Type: application/json' -d '{...}'"
  ]
}
```

### Step 5: 分析测试结果

- 检查 HTTP 状态码（200, 201, 400, 401, 403, 404, 500）
- 验证响应 JSON 结构
- 检查错误消息是否合理
- 确认数据正确性

### Step 6: 报告问题

报告格式：
```markdown
## 测试结果

### ✅ 通过的测试
- [测试项]: [结果描述]

### ❌ 失败的测试
- [测试项]: [错误描述]
  - 预期: [预期结果]
  - 实际: [实际结果]
  - 根因: [根本原因分析]
  - 建议: [修复建议]
```

## 资源索引

### Scripts（脚本）

| 脚本 | 用途 | 使用场景 |
|------|------|----------|
| `scripts/api_test.py` | API 接口测试 | 需要批量测试多个端点时 |
| `scripts/check_port.py` | 端口服务检测 | 验证服务是否在指定端口运行 |
| `scripts/db_verify.py` | 数据库验证 | 检查数据完整性和表结构 |
| `scripts/smoke_test.py` | 快速冒烟测试 | 快速验证核心功能是否正常 |

### References（参考文档）

| 文档 | 用途 | 使用场景 |
|------|------|----------|
| `references/test-checklist.md` | 测试检查清单 | 需要系统性测试时参考 |
| `references/common-bugs.md` | 常见 Bug 模式 | 诊断问题时参考 |
| `references/test-patterns.md` | 测试模式库 | 按模块类型测试时参考 |
| `references/api-testing-guide.md` | API 测试指南 | 编写测试用例时参考 |

### Assets（资源文件）

| 文件 | 用途 |
|------|------|
| `assets/test-report-template.md` | 测试报告模板 |

## 常见测试场景

### 场景 1: 测试新功能实现

1. 确认服务运行正常
2. 获取相应角色的认证令牌
3. 测试 CRUD 操作
4. 验证权限控制
5. 检查数据库数据
6. 验证响应格式

### 场景 2: 诊断 Bug

1. 复现 Bug
2. 检查相关日志
3. 分析 API 请求/响应
4. 检查数据库状态
5. 定位根因
6. 提供修复建议

### 场景 3: 回归测试

1. 获取测试清单
2. 依次执行测试
3. 对比预期结果
4. 记录失败项
5. 生成测试报告

### 场景 4: 权限测试

1. 以不同角色登录
2. 测试相同操作
3. 验证权限边界
4. 检查 403 响应是否正确

## 注意事项

### ⚠️ 关键约束

1. **exec_sql 可能返回过期数据**：关键验证必须使用 REST API
2. **端口必须使用 5000**：禁止使用 9000（系统保留）
3. **禁止杀死 9000 端口进程**：这是系统服务
4. **使用 pnpm 而非 npm/yarn**：包管理器约束
5. **Service Role Key 仅用于测试**：生产环境禁止使用

### ⚠️ 常见错误

1. **权限比较错误**：
   - 错误：`application.partner_id === authUser.id`（比较不同类型 UUID）
   - 正确：使用 `canPartnerAccessApplication()` 函数

2. **状态检查遗漏**：
   - 错误：只检查 `status === 'draft'`
   - 正确：检查所有终端状态 `['accepted', 'rejected', 'withdrawn']`

3. **字段位置错误**：
   - 错误：直接从 `application.personal_statement` 读取
   - 正确：从 `application.profile_snapshot.personal_statement` 读取

## 快速测试命令

```bash
# 1. 服务健康检查
curl -I http://localhost:5000

# 2. 登录获取令牌
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/signin \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"Test1234!"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin).get('session',{}).get('access_token',''))")

# 3. 测试 API
curl -s http://localhost:5000/api/applications -H "Authorization: Bearer $TOKEN"

# 4. 检查日志
tail -n 50 /app/work/logs/bypass/app.log | grep -iE "error|exception"
```

## 输出格式

测试完成后，输出标准化报告：

```markdown
# 测试报告

**测试时间**: YYYY-MM-DD HH:MM:SS
**测试范围**: [模块列表]
**测试结果**: X/Y 通过 (Z%)

## 详细结果

### ✅ 通过项 (X)
1. [测试项] - [结果描述]

### ❌ 失败项 (Y)
1. [测试项]
   - 错误: [错误信息]
   - 根因: [根本原因]
   - 建议: [修复建议]

## 改进建议

1. [建议1]
2. [建议2]
```
