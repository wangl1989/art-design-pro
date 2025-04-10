<template>
  <div class="permission-list">
    <!-- 页面权限分组 -->
    <div class="permission-group">
      <div class="permission-group-header" @click="toggleGroup('1')">
        <el-icon class="arrow-icon" :class="{ 'is-expanded': groupVisible['1'] }">
          <arrow-right />
        </el-icon>
        <span>页面权限</span>
      </div>
      <div v-show="groupVisible['1']">
        <el-table :data="getPermissionsByType('1')" style="width: 100%" :show-header="false">
          <el-table-column prop="permissionName" label="权限名称" min-width="180" />
          <el-table-column label="操作" width="120" align="right">
            <template #default="scope">
              <span class="action-btn edit-btn" @click="handleEdit(scope.row)">编辑</span>
              <span class="action-btn delete-btn" @click="handleDelete(scope.row)">删除</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 按钮权限分组 -->
    <div class="permission-group">
      <div class="permission-group-header" @click="toggleGroup('2')">
        <el-icon class="arrow-icon" :class="{ 'is-expanded': groupVisible['2'] }">
          <arrow-right />
        </el-icon>
        <span>按钮权限</span>
      </div>
      <div v-show="groupVisible['2']">
        <el-table :data="getPermissionsByType('2')" style="width: 100%" :show-header="false">
          <el-table-column prop="permissionName" label="权限名称" min-width="180" />
          <el-table-column label="操作" width="120" align="right">
            <template #default="scope">
              <span class="action-btn edit-btn" @click="handleEdit(scope.row)">编辑</span>
              <span class="action-btn delete-btn" @click="handleDelete(scope.row)">删除</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- API权限分组 -->
    <div class="permission-group">
      <div class="permission-group-header" @click="toggleGroup('3')">
        <el-icon class="arrow-icon" :class="{ 'is-expanded': groupVisible['3'] }">
          <arrow-right />
        </el-icon>
        <span>API权限</span>
      </div>
      <div v-show="groupVisible['3']">
        <el-table :data="getPermissionsByType('3')" style="width: 100%" :show-header="false">
          <el-table-column prop="permissionName" label="权限名称" min-width="180" />
          <el-table-column label="操作" width="120" align="right">
            <template #default="scope">
              <span class="action-btn edit-btn" @click="handleEdit(scope.row)">编辑</span>
              <span class="action-btn delete-btn" @click="handleDelete(scope.row)">删除</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive } from 'vue'
  import { ArrowRight } from '@element-plus/icons-vue'

  const props = defineProps({
    permissions: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['edit', 'delete'])

  // 分组显示状态
  const groupVisible = reactive<Record<string, boolean>>({
    '1': true, // 页面权限默认展开
    '2': true, // 按钮权限默认展开
    '3': true // API权限默认展开
  })

  // 切换分组显示/隐藏
  const toggleGroup = (type: string) => {
    groupVisible[type] = !groupVisible[type]
  }

  // 根据权限类型获取权限列表
  const getPermissionsByType = (type: string) => {
    if (!props.permissions) return []
    return props.permissions.filter((item: any) => item.permissionType === type)
  }

  // 编辑权限
  const handleEdit = (row: any) => {
    emit('edit', row)
  }

  // 删除权限
  const handleDelete = (row: any) => {
    emit('delete', row)
  }
</script>

<style lang="scss" scoped>
  .permission-list {
    .permission-group {
      margin-bottom: 5px;

      .permission-group-header {
        display: flex;
        align-items: center;
        padding: 8px 0;
        margin-bottom: 5px;
        font-weight: 500;
        color: #303133;
        cursor: pointer;
        border-bottom: 1px solid #ebeef5;

        .arrow-icon {
          margin-right: 5px;
          font-size: 14px;
          transition: transform 0.2s;

          &.is-expanded {
            transform: rotate(90deg);
          }
        }
      }

      .empty-tip {
        padding: 10px 0;
        font-size: 14px;
        color: #909399;
        text-align: center;
      }

      :deep(.el-table) {
        .el-table__row {
          td {
            border-bottom: 1px solid #ebeef5;
          }
        }
      }

      .action-btn {
        margin-left: 10px;
        font-size: 12px;
        cursor: pointer;
      }

      .edit-btn {
        color: #409eff;
      }

      .delete-btn {
        color: #f56c6c;
      }
    }
  }
</style>
