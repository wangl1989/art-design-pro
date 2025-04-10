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
