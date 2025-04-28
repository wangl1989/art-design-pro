<template>
  <div class="page-content">
    <el-row>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-input v-model="searchForm.name" placeholder="角色名称"></el-input>
      </el-col>
      <div style="width: 12px"></div>
      <el-col :xs="24" :sm="12" :lg="6" class="el-col2">
        <el-button v-ripple @click="loadRoleData">搜索</el-button>
        <el-button @click="showDialog('add')" v-ripple>新增角色</el-button>
      </el-col>
    </el-row>

    <art-table
      :data="tableData"
      :currentPage="pagination.current"
      :pageSize="pagination.size"
      :total="pagination.total"
      @page-change="handlePageChange"
      @size-change="handleSizeChange"
      v-loading="loading"
    >
      <template #default>
        <el-table-column label="角色名称" prop="name" />
        <el-table-column label="描述" prop="remarks" />
        <el-table-column label="状态" prop="delFlag">
          <template #default="scope">
            <el-tag :type="scope.row.delFlag ? 'primary' : 'info'">
              {{ scope.row.delFlag ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="创建时间"
          prop="createDate"
          sortable
          @sort-change="handleSortChange"
        >
          <template #default="scope">
            {{ formatDate(scope.row.createDate) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="100px">
          <template #default="scope">
            <el-row>
              <button-more
                :list="[
                  { key: 'permission', label: '菜单权限' },
                  { key: 'edit', label: '编辑角色' },
                  { key: 'delete', label: '删除角色' }
                ]"
                @click="buttonMoreClick($event, scope.row)"
              />
            </el-row>
          </template>
        </el-table-column>
      </template>
    </art-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增角色' : '编辑角色'"
      width="30%"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" />
        </el-form-item>
        <!-- <el-form-item label="状态">
          <el-switch v-model="form.status" />
        </el-form-item> -->
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit(formRef)">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog v-model="permissionDialog" title="菜单权限" width="30%">
      <div :style="{ maxHeight: '500px', overflowY: 'scroll' }">
        <permission-tree
          ref="permissionTreeRef"
          :menu-list="menuList"
          :checked-keys="[]"
          :allow-menu-selection="true"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialog = false">取消</el-button>
          <el-button type="primary" @click="savePermissions">保存权限</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ButtonMoreItem } from '@/components/Form/ButtonMore.vue'
  import { useMenuStore } from '@/store/modules/menu'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import { RoleService } from '@/api/roleApi'
  import { RoleRecord, RoleListParams } from '@/api/model/roleModel'
  import { formatDate } from '@/utils/date'
  import { onMounted } from 'vue'
  import PermissionTree from '@/components/Permission/PermissionTree.vue'

  const dialogVisible = ref(false)
  const permissionDialog = ref(false)
  const menuList = computed(() => useMenuStore().getMenuList)
  const loading = ref(false)

  // 权限树引用
  const permissionTreeRef = ref()

  // 当前选中的权限
  const selectedPermissions = ref<number[]>([])
  // 当前选中的菜单
  const selectedMenuIds = ref<number[]>([])
  // 当前编辑的角色ID
  const currentRoleId = ref<number | string>(0)

  // 保存权限设置
  const savePermissions = async () => {
    if (!currentRoleId.value) {
      ElMessage.warning('请先选择一个角色')
      return
    }

    try {
      // 获取当前选中的所有权限
      const { checkedKeys } = permissionTreeRef.value?.getCheckedKeys() || {
        checkedKeys: [],
        halfCheckedKeys: []
      }

      // 分离菜单ID和权限ID
      const menuIds: number[] = []
      const permissionIds: number[] = []

      // 遍历选中的节点，区分菜单和权限
      checkedKeys.forEach((key: any) => {
        if (typeof key === 'string') {
          if (key.startsWith('m_')) {
            // 菜单ID格式: m_1, m_2, ...
            const menuId = parseInt(key.substring(2))
            if (!isNaN(menuId)) {
              menuIds.push(menuId)
            }
          } else if (key.startsWith('p_')) {
            // 权限ID格式: p_1, p_2, ...
            const permId = parseInt(key.substring(2))
            if (!isNaN(permId)) {
              permissionIds.push(permId)
            }
          }
        }
      })

      // 调用保存权限的API
      const response = await RoleService.saveRolePermissions({
        roleId: currentRoleId.value,
        permissionIds,
        menuIds
      })

      if (response.success) {
        ElMessage.success('权限设置保存成功')
        permissionDialog.value = false
      } else {
        ElMessage.error(response.message || '保存失败')
      }
    } catch (error) {
      console.error('保存权限失败:', error)
      ElMessage.error('保存权限失败，请重试')
    }
  }

  const formRef = ref<FormInstance>()

  const rules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入角色名称', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    remarks: [{ required: true, message: '请输入角色描述', trigger: 'blur' }]
  })

  const form = reactive({
    id: 0,
    name: '',
    remarks: ''
  })

  // 搜索表单
  const searchForm = reactive<RoleListParams>({
    name: '',
    page: 1,
    limit: 10,
    sortByCreateDateAsc: null
  })

  // 表格数据
  const tableData = ref<RoleRecord[]>([])

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 加载角色数据
  const loadRoleData = async () => {
    loading.value = true
    try {
      const response = await RoleService.getRoleList(searchForm)
      if (response.success) {
        tableData.value = response.data.records
        pagination.total = response.data.total
        pagination.current = response.data.current
        pagination.size = response.data.size
        pagination.pages = response.data.pages
      } else {
        ElMessage.error(response.message || '获取角色列表失败')
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      ElMessage.error('获取角色列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    searchForm.page = page
    loadRoleData()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    searchForm.limit = size
    searchForm.page = 1 // 切换每页数量时重置为第一页
    loadRoleData()
  }

  // 处理排序变化
  const handleSortChange = (column: any) => {
    if (column.prop === 'createDate') {
      searchForm.sortByCreateDateAsc =
        column.order === 'ascending' ? true : column.order === 'descending' ? false : null
    }
    loadRoleData()
  }

  const dialogType = ref('add')

  const showDialog = (type: string, row?: RoleRecord) => {
    dialogVisible.value = true
    dialogType.value = type

    if (type === 'edit' && row) {
      form.id = row.id
      form.name = row.name
      form.remarks = row.remarks || ''
    } else {
      form.id = 0
      form.name = ''
      form.remarks = ''
    }
  }

  const buttonMoreClick = (item: ButtonMoreItem, row: RoleRecord) => {
    if (item.key === 'permission') {
      showPermissionDialog(row)
    } else if (item.key === 'edit') {
      showDialog('edit', row)
    } else if (item.key === 'delete') {
      deleteRole()
    }
  }

  const showPermissionDialog = (row: RoleRecord) => {
    permissionDialog.value = true
    currentRoleId.value = row.id

    // 重置权限选择
    selectedPermissions.value = []
    selectedMenuIds.value = []

    // 加载角色的权限
    loadRolePermissions(row.id)
  }

  // 加载角色权限
  const loadRolePermissions = async (roleId: number) => {
    try {
      const response = await RoleService.getRolePermissions(roleId)

      if (response.success) {
        // 接口返回的权限ID和菜单ID分别保存
        const { menuIds, permissionIds } = response.data || { menuIds: [], permissionIds: [] }
        selectedPermissions.value = permissionIds || []
        selectedMenuIds.value = menuIds || []

        // 将菜单ID和权限ID格式化为树组件需要的格式
        const formattedMenuIds = (menuIds || []).map((id) => `m_${id}`)
        const formattedPermIds = (permissionIds || []).map((id) => `p_${id}`)

        // 合并所有需要选中的节点ID
        const allCheckedKeys = [...formattedMenuIds, ...formattedPermIds]

        // 确保树组件已经初始化
        if (permissionTreeRef.value) {
          // 先清空选中状态
          permissionTreeRef.value.resetChecked()

          // 设置新的选中状态
          // 注意：元素树组件加载可能需要时间，所以添加短暂延迟
          setTimeout(() => {
            if (permissionTreeRef.value) {
              permissionTreeRef.value.setCheckedKeys(allCheckedKeys)
            }
          }, 200)
        }
      } else {
        // 接口调用失败，使用空数组
        selectedPermissions.value = []
        selectedMenuIds.value = []
        ElMessage.warning(response.message || '获取角色权限失败')
      }
    } catch (error) {
      console.error('获取角色权限失败:', error)
      ElMessage.error('获取角色权限失败，请重试')
      selectedPermissions.value = [] // 出错时清空权限
      selectedMenuIds.value = [] // 出错时清空菜单
    }
  }

  const deleteRole = () => {
    ElMessageBox.confirm('确定删除该角色吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(() => {
      ElMessage.success('删除成功')
      loadRoleData() // 重新加载数据
    })
  }

  const handleSubmit = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    await formEl.validate(async (valid) => {
      if (valid) {
        try {
          if (dialogType.value === 'add') {
            // 调用新增角色API
            const response = await RoleService.addRole({
              name: form.name,
              remarks: form.remarks
            })
            if (response.success) {
              ElMessage.success('新增成功')
              dialogVisible.value = false
              formEl.resetFields()
              loadRoleData() // 重新加载数据
            } else {
              ElMessage.error(response.message || '新增失败')
            }
          } else {
            // 调用更新角色API
            const response = await RoleService.updateRole({
              id: form.id,
              name: form.name,
              remarks: form.remarks
            })
            if (response.success) {
              ElMessage.success('修改成功')
              dialogVisible.value = false
              formEl.resetFields()
              loadRoleData() // 重新加载数据
            } else {
              ElMessage.error(response.message || '修改失败')
            }
          }
        } catch (error) {
          console.error('提交角色数据失败:', error)
          ElMessage.error('操作失败，请重试')
        }
      }
    })
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadRoleData()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    .svg-icon {
      width: 1.8em;
      height: 1.8em;
      overflow: hidden;
      vertical-align: -8px;
      fill: currentcolor;
    }
  }

  /* 修复aria-hidden警告 */
  :deep(div[aria-hidden='true']) {
    display: none !important;
  }
</style>
