<template>
  <div class="permission-tree-container">
    <el-tree
      ref="treeRef"
      :data="treeData"
      show-checkbox
      node-key="id"
      :props="defaultProps"
      :default-expanded-keys="defaultExpandedKeys"
      :default-checked-keys="defaultCheckedKeys"
      check-strictly
      @check="handleCheck"
    >
      <template #default="{ data }">
        <span class="custom-tree-node">
          <!-- ===== 菜单节点 ===== -->
          <span v-if="!data.isPermission" class="node-content menu-node">
            <i v-if="data.meta?.icon" :class="data.meta.icon" class="node-icon"></i>
            <span class="node-title menu-title">{{ formatTitle(data) }}</span>
            <!-- 菜单 Tag -->
            <el-tag size="small" class="node-tag tag-menu">菜单</el-tag>
          </span>

          <!-- ===== 权限节点 ===== -->
          <span v-else class="node-content permission-node">
            <!-- 你可以保留或移除权限图标 -->
            <i class="node-icon permission-icon el-icon-key"></i>
            <span
              class="node-title permission-title"
              :class="getPermissionClass(data.permissionType)"
            >
              {{ data.permissionName }}
            </span>
            <!-- 固定权限 Tag -->
            <el-tag size="small" class="node-tag tag-permission">权限</el-tag>
            <!-- 类型权限 Tag -->
            <el-tag
              size="small"
              :type="getPermissionTagType(data.permissionType)"
              class="node-tag tag-permission-type"
            >
              {{ getPermissionTypeText(data.permissionType) }}
            </el-tag>
          </span>
        </span>
      </template>
    </el-tree>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { MenuListType } from '@/types/menu'
  import { formatMenuTitle } from '@/utils/menu'
  import { ElTree, ElTag } from 'element-plus' // 确保 ElTag 已导入或自动导入
  import type { TagProps } from 'element-plus'

  // --- Props, Emits, Refs 等保持不变 ---
  interface Props {
    menuList: MenuListType[] // 菜单列表
    checkedKeys?: (number | string)[] // 修改: 接受 string[] (带前缀的)
    defaultExpandLevel?: number // 默认展开的层级
  }

  interface EmitType {
    (e: 'change', menuIds: number[], permissionIds: number[], halfMenuIds?: number[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    menuList: () => [],
    checkedKeys: () => [],
    defaultExpandLevel: 2
  })

  const emit = defineEmits<EmitType>()
  const treeRef = ref<InstanceType<typeof ElTree>>()
  const defaultExpandedKeys = ref<(string | number)[]>([]) // 修改: 类型匹配 node-key
  const defaultCheckedKeys = ref<(string | number)[]>([]) // 修改: 类型匹配 node-key

  // --- 权限类型映射样式类 (用于文字颜色, 可选保留或移除) ---
  const permissionTypeClass = {
    1: 'permission-page', // 页面权限
    2: 'permission-button', // 按钮权限
    3: 'permission-api' // API权限
  }
  const getPermissionClass = (type?: number) => {
    return type && type in permissionTypeClass
      ? permissionTypeClass[type as keyof typeof permissionTypeClass]
      : ''
  }

  // --- 格式化菜单标题 ---
  const formatTitle = (data: any) => {
    return data.meta?.title ? formatMenuTitle(data.meta.title) : data.name || '未命名菜单'
  }

  // ---  辅助函数：获取权限类型文本 ---
  const getPermissionTypeText = (type?: string): string => {
    switch (type) {
      case '1':
        return '页面'
      case '2':
        return '按钮'
      case '3':
        return 'API'
      default:
        return '未知'
    }
  }

  // --- 辅助函数：获取权限类型对应的 Tag 类型 (用于背景色) ---
  const getPermissionTagType = (type?: string): TagProps['type'] => {
    switch (type) {
      case '1':
        return 'warning' // 页面 - 黄色
      case '2':
        return 'success' // 按钮 - 绿色
      case '3':
        return 'danger' // API - 红色
      default:
        return 'info' // 未知 - 灰色
    }
  }

  // --- treeData 计算属性 (重要修改：确保 ID 格式统一) ---
  const treeData = computed(() => {
    const processMenuData = (menus: MenuListType[]): any[] => {
      if (!menus || !menus.length) return []

      return menus.map((menu) => {
        // 菜单节点 ID 使用 'm_' 前缀
        const menuNodeId = `m_${menu.id}`
        const menuNode = {
          ...menu,
          id: menuNodeId, // 使用带前缀的 ID 作为 node-key
          rawId: menu.id,
          isPermission: false
        }

        const permissionNodes: any[] = []
        if (menu.meta?.authList && menu.meta.authList.length > 0) {
          menu.meta.authList.forEach((auth) => {
            // 权限节点 ID 使用 'p_' 前缀
            const permissionNodeId = `p_${auth.id}`
            permissionNodes.push({
              id: permissionNodeId, // 使用带前缀的 ID 作为 node-key
              parentId: menuNodeId, // 父节点 ID 也应是带前缀的
              rawId: auth.id,
              menuId: menu.id,
              isPermission: true,
              permissionId: auth.id,
              permissionName: auth.permissionName || '未命名权限',
              permissionCode: auth.permissionCode,
              permissionType: auth.permissionType,
              remarks: auth.remarks
            })
          })
        }

        const childMenuNodes = menu.children ? processMenuData(menu.children) : []
        menuNode.children = [...permissionNodes, ...childMenuNodes]
        return menuNode
      })
    }
    return processMenuData(props.menuList)
  })

  // --- handleCheck 事件处理 ---
  const handleCheck = (node: any, { checkedNodes, halfCheckedNodes }: any) => {
    const menuIds: number[] = []
    const permissionIds: number[] = []
    const halfMenuIds: number[] = [] // 用于存放半选中的 *菜单* 的 rawId

    // check-strictly=true 时，checkedNodes 只包含完全选中的节点
    checkedNodes.forEach((n: any) => {
      if (n.isPermission && n.permissionId) {
        permissionIds.push(n.permissionId)
      } else if (!n.isPermission && n.rawId) {
        menuIds.push(n.rawId)
      }
    })

    // check-strictly=true 时，halfCheckedNodes 通常只包含菜单节点
    halfCheckedNodes.forEach((n: any) => {
      if (!n.isPermission && n.rawId) {
        halfMenuIds.push(n.rawId)
      }
    })

    emit('change', menuIds, permissionIds, halfMenuIds.length > 0 ? halfMenuIds : undefined)
  }

  // --- 初始化 Tree (修改 defaultExpandedKeys 和 defaultCheckedKeys 类型) ---
  const initTree = () => {
    const expandedKeys: (string | number)[] = [] // 修改类型
    const findExpandKeys = (nodes: any[], level = 1) => {
      // 使用处理后的 treeData
      if (!nodes || !nodes.length) return
      nodes.forEach((node) => {
        if (level <= props.defaultExpandLevel && node.id) {
          // 使用处理后的 id
          expandedKeys.push(node.id)
        }
        if (node.children) {
          findExpandKeys(node.children, level + 1)
        }
      })
    }
    // 基于计算出的 treeData 来确定展开项
    findExpandKeys(treeData.value)
    defaultExpandedKeys.value = expandedKeys

    // 设置默认选中 - 直接使用 props 传入的带前缀的 keys
    defaultCheckedKeys.value = props.checkedKeys || []
    // 如果父组件传的是原始 ID，需要在这里转换
    // defaultCheckedKeys.value = (props.checkedKeys || []).map(key => typeof key === 'number' ? `m_${key}` : key); // 示例转换逻辑

    // 确保在 tree 渲染后设置选中状态
    nextTick(() => {
      if (treeRef.value) {
        treeRef.value.setCheckedKeys(defaultCheckedKeys.value)
      }
    })
  }

  // --- 获取选中、重置、设置选中状态的方法 (重要修改：返回/接收带前缀的 key) ---
  const getCheckedKeys = () => {
    if (!treeRef.value) return { checkedKeys: [], halfCheckedKeys: [] }
    // getCheckedKeys 和 getHalfCheckedKeys 在 check-strictly=true 时返回 node-key ('m_xxx', 'p_xxx')
    const keys = treeRef.value.getCheckedKeys() || []
    const halfKeys = treeRef.value.getHalfCheckedKeys() || []
    console.log('Tree getCheckedKeys (带前缀):', keys)
    console.log('Tree getHalfCheckedKeys (带前缀):', halfKeys)
    return {
      checkedKeys: keys,
      halfCheckedKeys: halfKeys
    }
  }

  const resetChecked = () => {
    treeRef.value?.setCheckedKeys([])
  }

  // setCheckedKeys 应该接收带前缀的 ID 数组
  const setCheckedKeys = (keys: (string | number)[]) => {
    console.log('Tree setCheckedKeys (接收带前缀):', keys)
    treeRef.value?.setCheckedKeys(keys || [])
  }

  defineExpose({ getCheckedKeys, resetChecked, setCheckedKeys })

  // --- Watchers ---
  watch(
    () => props.menuList,
    () => {
      // 菜单列表变化时，重新计算 treeData 并初始化
      nextTick(() => {
        // 确保 treeData 更新
        initTree()
      })
    },
    { deep: true }
  )

  // 监听外部传入的选中项变化
  watch(
    () => props.checkedKeys,
    (newKeys) => {
      console.log('外部传入 checkedKeys 变化:', newKeys)
      if (treeRef.value && newKeys) {
        // 假设 props.checkedKeys 已经是带前缀的格式
        setCheckedKeys(newKeys)
        // 如果 props.checkedKeys 是原始 ID，需要转换
        // const formattedKeys = (newKeys || []).map(k => typeof k === 'number' ? `m_${k}` : k); // 示例转换
        // setCheckedKeys(formattedKeys);
      } else if (treeRef.value && !newKeys) {
        resetChecked() // 如果传入 null 或 undefined，则清空
      }
    },
    { immediate: true }
  ) // immediate: true 确保初始加载时执行

  onMounted(() => {
    // initTree() 会在 checkedKeys 的 immediate watch 中被调用，这里可能不需要重复调用
    // initTree()
  })

  const defaultProps = {
    children: 'children',
    label: (data: any) => (data.isPermission ? data.permissionName : formatTitle(data))
    // disabled: (data: any) => data.disabled // 如果需要禁用某些节点
  }
</script>

<style lang="scss" scoped>
  .permission-tree-container {
    width: 100%;

    .custom-tree-node {
      display: flex;
      flex-grow: 1; /* 允许节点内容伸展 */
      align-items: center;
      width: 100%; /* 确保节点内容占满宽度以便对齐 */
      font-size: 14px;

      .node-content {
        display: inline-flex; /* 使用 flex 布局内部元素 */
        flex-grow: 1; /* 占据可用空间 */
        align-items: center;
        // &.menu-node {} /* 可以为菜单节点添加特定样式 */
        // &.permission-node {} /* 可以为权限节点添加特定样式 */
      }

      .node-icon {
        margin-right: 5px;

        &.permission-icon {
          font-size: 12px;
          color: #909399;
        }
      }

      .node-title {
        flex-shrink: 0; /* 防止标题被压缩 */
        margin-right: 8px; /* 标题和第一个 tag 之间的间距 */

        &.menu-title {
          // font-weight: 500; // 可以取消加粗，让 tag 更突出
          color: var(--el-text-color-primary); // 保持默认颜色或主题色
        }

        &.permission-title {
          font-size: 13px;
          color: #606266;
          // 可以移除这里的特定颜色类，让 tag 的颜色作为主要区分
          // &.permission-button { color: #67c23a; }
          // &.permission-api { color: #f56c6c; }
          // &.permission-page { color: #e6a23c; }
        }
      }

      .node-tag {
        flex-shrink: 0; /* 防止 tag 被压缩 */
        margin-left: 5px; /* Tag 之间的间距 */

        // 自定义 "菜单" Tag 背景色 (示例)
        &.tag-menu {
          color: #409eff; // Element UI 蓝色 info 文字
          background-color: #ecf5ff; // Element UI 蓝色 info 背景
          border-color: #d9ecff; // Element UI 蓝色 info 边框
        }

        // 自定义 "权限" Tag 背景色 (示例)
        &.tag-permission {
          color: #67c23a; // Element UI 绿色 success 文字
          background-color: #f0f9eb; // Element UI 绿色 success 背景
          border-color: #e1f3d8; // Element UI 绿色 success 边框
        }

        // 类型 Tag (页面/按钮/API) 使用 Element Plus 的 type 样式
        // 如果需要进一步自定义，可以添加类似下面的规则
        // &.tag-permission-type.el-tag--warning { ... }
        // &.tag-permission-type.el-tag--success { ... }
        // &.tag-permission-type.el-tag--danger { ... }
      }

      /* 权限节点增加缩进 (可选) */
      .permission-node {
        // margin-left: 15px; // 可以调整这里的缩进
      }
    }

    /* 调整 Element Tree 节点内容区域的内边距，给 tag 留出空间 */
    :deep(.el-tree-node__content) {
      padding-right: 10px; /* 增加右内边距 */
    }
  }
</style>
