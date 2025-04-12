/**
 * 新增菜单请求参数
 */
export interface AddMenuParams {
  name: string // 菜单名称
  parentId?: number // 父菜单ID，新增主菜单时不传
  sort?: number
  remarks?: string
  path: string // 路由地址
  component?: string // 组件路径，暂时未在表单中使用
  title: string // 菜单标题
  icon?: string // 菜单图标
  color?: string | null // 新增 color 字段
  showBadge?: boolean // 是否显示徽标，暂未在表单中使用
  showTextBadge?: string // 文本徽章内容，暂未在表单中使用
  isHide?: boolean // 是否隐藏
  isHideTab?: boolean // 是否隐藏Tab，暂未在表单中使用
  link?: string // 外链地址
  isIframe?: boolean // 是否内嵌
  keepAlive?: boolean // 是否缓存
  isInMainContainer?: boolean // 是否在主容器中显示，暂未在表单中使用
}

/**
 * 编辑菜单请求参数，继承自新增参数并添加ID
 */
export interface EditMenuParams extends AddMenuParams {
  id: number // 菜单ID
}

/**
 * 权限类型枚举
 */
export enum PermissionTypeEnum {
  ROUTE = 1, // 路由权限
  BUTTON = 2, // 按钮权限
  API = 3 // API权限
}

/**
 * API权限对象
 */
export interface ApiPermission {
  apiUrl: string // API请求地址（必填）
  httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE' // HTTP方法（必填）
  common: boolean // 是否为公共接口（必填，默认false）
  remarks?: string // 备注（非必填）
}

/**
 * 页面权限对象
 */
export interface PagePermission {
  pageUrl: string // 页面请求地址（必填）
  remarks?: string // 备注（非必填）
}

/**
 * 按钮权限对象
 */
export interface ButtonPermission {
  buttonName: string // 按钮功能名称（必填）
  buttonKey: string // 按钮标识（必填）
  remarks?: string // 备注（非必填）
}

/**
 * 基础权限参数
 */
export interface BasePermissionParams {
  permissionName: string // 权限名称（必填）
  permissionCode: string // 权限标识（必填）
  permissionType: PermissionTypeEnum // 权限类型（必填）
  menuId: number // 菜单ID（必填）
  icon?: string // 图标（可选）
  color?: string // 颜色（可选）
  sort?: number // 排序（可选）
  remarks?: string // 备注（可选）
  api?: ApiPermission // API权限对象（三选一）
  pagePermission?: PagePermission // 页面权限对象（三选一）
  button?: ButtonPermission // 按钮权限对象（三选一）
}

/**
 * 新增权限请求参数
 */
export type AddPermissionParams = BasePermissionParams

/**
 * 编辑权限请求参数
 */
export interface EditPermissionParams extends AddPermissionParams {
  id: number // 权限ID（必填）
}
