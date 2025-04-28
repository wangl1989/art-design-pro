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
      @node-expand="handleNodeExpand"
      @node-collapse="handleNodeCollapse"
    >
      <template #default="{ data, expanded }">
        <div class="custom-tree-node" :class="data.isPermission ? 'permission-node' : 'menu-node'">
          <!-- ===== 菜单节点 ===== -->
          <template v-if="!data.isPermission">
            <span class="node-icon">
              <!-- 文件夹图标，根据展开状态显示不同图标 -->
              <span v-if="expanded">📂</span>
              <span v-else>📁</span>
            </span>
            <span class="node-title menu-title">{{ formatTitle(data) }}</span>
            <!-- 菜单 Tag 放到最右边 -->
            <span class="tag-wrapper">
              <el-tag size="small" class="node-tag tag-menu">菜单</el-tag>
            </span>
          </template>

          <!-- ===== 权限节点 ===== -->
          <template v-else>
            <!-- 根据权限类型显示不同图标 -->
            <span class="node-icon">
              <span v-if="data.permissionType === '1'">🔗</span>
              <span v-else-if="data.permissionType === '2'">🔘</span>
              <span v-else-if="data.permissionType === '3'">🔑</span>
              <span v-else>🔑</span>
            </span>
            <span class="node-title permission-title">
              {{ data.permissionName }}
            </span>
            <!-- 权限类型 Tag 放到最右边 -->
            <span class="tag-wrapper">
              <el-tag size="small" v-if="data.common" type="success" :round="true" class="node-tag"
                >公用</el-tag
              >
              <el-tag
                size="small"
                :type="getPermissionTagType(data.permissionType)"
                class="node-tag"
              >
                {{ getPermissionTypeText(data.permissionType) }}
              </el-tag>
            </span>
          </template>
        </div>
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
    allowMenuSelection?: boolean // 新增: 是否允许选择菜单节点
  }

  interface EmitType {
    (e: 'change', menuIds: number[], permissionIds: number[], halfMenuIds?: number[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    menuList: () => [],
    checkedKeys: () => [],
    defaultExpandLevel: 2,
    allowMenuSelection: true // 默认允许选择菜单节点
  })

  const emit = defineEmits<EmitType>()
  const treeRef = ref<InstanceType<typeof ElTree>>()
  const defaultExpandedKeys = ref<(string | number)[]>([]) // 修改: 类型匹配 node-key
  const defaultCheckedKeys = ref<(string | number)[]>([]) // 修改: 类型匹配 node-key

  // 处理节点展开和收起事件
  const handleNodeExpand = () => {
    // 这些方法在ElTree的实例上调用时会触发重新渲染
    // 我们这里不需要做额外处理，因为expanded属性会自动传递到template中
  }

  const handleNodeCollapse = () => {
    // 同上
  }

  // --- 辅助函数：格式化菜单标题 ---
  const formatTitle = (data: any) => {
    return data.meta?.title ? formatMenuTitle(data.meta.title) : data.name || '未命名菜单'
  }

  // ---  辅助函数：获取权限类型文本 ---
  const getPermissionTypeText = (type?: string): string => {
    switch (type) {
      case '1':
        return '路由'
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
        return 'primary' // 路由 - 蓝色
      case '2':
        return 'success' // 按钮 - 绿色
      case '3':
        return 'warning' // API - 橙色
      default:
        return 'info' // 未知 - 灰色
    }
  }

  // --- treeData 计算属性 (修改：根据allowMenuSelection属性处理菜单节点的禁用状态) ---
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
          isPermission: false,
          disabled: !props.allowMenuSelection // 根据allowMenuSelection设置禁用状态
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
              common: auth.api?.common,
              remarks: auth.remarks,
              disabled: false // 权限节点始终可选
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
    // 检查是否点击了禁用的菜单节点
    if (node.disabled) {
      // 如果是禁用节点，则不允许选中
      treeRef.value?.setChecked(node.id, false, false)
      return
    }

    const menuIds: number[] = []
    const permissionIds: number[] = []
    const halfMenuIds: number[] = [] // 用于存放半选中的 *菜单* 的 rawId

    // check-strictly=true 时，checkedNodes 只包含完全选中的节点
    checkedNodes.forEach((n: any) => {
      // 跳过被禁用的节点
      if (n.disabled) return

      if (n.isPermission && n.permissionId) {
        permissionIds.push(n.permissionId)
      } else if (!n.isPermission && n.rawId) {
        menuIds.push(n.rawId)
      }
    })

    // check-strictly=true 时，halfCheckedNodes 通常只包含菜单节点
    halfCheckedNodes.forEach((n: any) => {
      // 跳过被禁用的节点
      if (n.disabled) return

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
      if (treeRef.value && newKeys) {
        // 假设 props.checkedKeys 已经是带前缀的格式
        setCheckedKeys(newKeys)
      } else if (treeRef.value && !newKeys) {
        resetChecked() // 如果传入 null 或 undefined，则清空
      }
    },
    { immediate: true }
  ) // immediate: true 确保初始加载时执行

  onMounted(() => {
    // initTree() 会在 checkedKeys 的 immediate watch 中被调用，这里可能不需要重复调用
  })

  const defaultProps = {
    children: 'children',
    label: (data: any) => (data.isPermission ? data.permissionName : formatTitle(data)),
    disabled: 'disabled' // 添加这行，告诉ElTree使用节点的disabled属性
  }
</script>

<style lang="scss" scoped>
  .permission-tree-container {
    width: 100%;

    .custom-tree-node {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 6px 0;
      font-size: 14px;
      border-radius: 4px;

      /* 节点类型样式 */
      &.menu-node {
        background-color: #f5f7fa;
      }

      &.permission-node {
        background-color: #fff;
      }
    }

    .node-icon {
      margin-right: 8px;
      font-size: 16px;
    }

    .node-title {
      flex-grow: 1;
      margin-right: 8px;

      &.menu-title {
        color: var(--el-text-color-primary);
      }

      &.permission-title {
        color: #666; /* 略浅色字体 */
      }
    }

    .tag-wrapper {
      margin-left: auto; /* 将标签推到最右侧 */
    }

    .node-tag {
      margin-right: 10px;
    }

    /* 调整 Element Plus Tree 节点样式 */
    :deep(.el-tree-node__content) {
      height: auto; /* 允许节点高度自适应 */
      padding: 2px 0;
    }

    /* 调整树节点间距 */
    :deep(.el-tree-node) {
      margin: 2px 0; /* 节点间的间距 */
    }

    /* 调整选择框位置 */
    :deep(.el-checkbox) {
      margin-right: 6px;
    }
  }
</style>
