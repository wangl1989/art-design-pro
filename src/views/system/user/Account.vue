<template>
  <div class="page-content">
    <div class="custom-table-bar">
      <div class="search-container" v-show="showSearchWrap">
        <el-form
          :model="searchForm"
          ref="searchFormRef"
          inline
          class="search-form"
          label-width="80px"
        >
          <el-row :gutter="8" class="search-row">
            <el-col :xs="24" :sm="12" :lg="5">
              <el-form-item label="登录账号:">
                <el-input
                  v-model="searchForm.loginName as string"
                  prop="loginName"
                  placeholder="请输入登录账号"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="5">
              <el-form-item label="手机号:">
                <el-input
                  v-model="searchForm.tel as string"
                  prop="tel"
                  placeholder="请输入手机号"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="5">
              <el-form-item label="邮箱:">
                <el-input
                  v-model="searchForm.email as string"
                  prop="email"
                  placeholder="请输入邮箱"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="5">
              <el-form-item label="位置:">
                <el-input
                  v-model="searchForm.location as string"
                  prop="location"
                  placeholder="请输入位置"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :sm="12" :lg="4" class="search-buttons">
              <el-button type="primary" @click="search" v-auth="'user_search'" v-ripple
                >搜索</el-button
              >
              <el-button @click="resetForm(searchFormRef)" v-ripple>重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </div>
      <div class="tool-container">
        <div class="left-wrap">
          <el-button @click="showDialog('add')" v-auth="'user_add'" v-ripple>添加用户</el-button>
        </div>
        <div class="right-wrap">
          <el-button-group>
            <el-button :icon="Search" @click="isShowSearchWrap()" />
            <el-button :icon="RefreshRight" @click="loadUserData()" />
            <el-popover placement="bottom-end" width="100" trigger="hover" @show="showPopover">
              <el-checkbox-group v-model="colOptions" :min="1">
                <el-checkbox
                  v-for="(item, index) in colSelect"
                  :label="item"
                  :value="item"
                  :key="item"
                  @change="changeColumn($event, index)"
                />
              </el-checkbox-group>
              <template #reference>
                <el-button :icon="Operation"></el-button>
              </template>
            </el-popover>
          </el-button-group>
        </div>
      </div>
    </div>

    <art-table
      :data="tableData"
      selection
      :currentPage="pagination.current"
      :pageSize="pagination.size"
      :total="pagination.total"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
      v-loading="loading"
    >
      <template #default>
        <el-table-column
          label="用户名"
          prop="avatar"
          #default="scope"
          width="300px"
          v-if="columns[0].show"
        >
          <div class="user" style="display: flex; align-items: center">
            <img class="avatar" :src="formatAvatar(scope.row.icon, scope.row.id)" />
            <div>
              <p class="user-name">{{ scope.row.nickName }}</p>
              <p class="email">{{ scope.row.email }}</p>
            </div>
          </div>
        </el-table-column>
        <el-table-column label="手机号" prop="tel" v-if="columns[1].show" />
        <el-table-column label="登录账号" prop="loginName" v-if="columns[2].show" />
        <el-table-column label="角色" prop="roles" #default="scope" v-if="columns[3].show">
          <el-tag v-for="role in scope.row.roles" :key="role.id" class="role-tag">
            {{ role.name }}
          </el-tag>
          <span v-if="!scope.row.roles || scope.row.roles.length === 0">-</span>
        </el-table-column>
        <el-table-column label="状态" prop="locked" v-if="columns[4].show">
          <template #default="scope">
            <el-tag :type="scope.row.locked ? 'danger' : 'success'">
              {{ scope.row.locked ? '锁定' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="位置" prop="location" v-if="columns[5].show" />
        <el-table-column label="更新日期" prop="updateDate" sortable v-if="columns[6].show">
          <template #default="scope">
            {{ formatDate(scope.row.updateDate) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="250px">
          <template #default="scope">
            <button-table type="edit" v-auth="'user_edit'" @click="showDialog('edit', scope.row)" />
            <button-table type="delete" v-auth="'user_delete'" @click="deleteUser(scope.row.id)" />
            <button-table
              type="more"
              v-auth="'user_assign'"
              @click="showPermissionDialog(scope.row)"
            />
          </template>
        </el-table-column>
      </template>
    </art-table>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
      width="30%"
      destroy-on-close
    >
      <div v-if="dialogType === 'add'" class="info-alert">
        <div class="info-icon">
          <i class="iconfont-sys" v-html="'&#xe71d;'"></i>
        </div>
        <div class="info-content">
          <p>注意：新增的用户默认密码是：123456</p>
        </div>
      </div>
      <div v-loading="formLoading">
        <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
          <el-form-item label="用户名" prop="nickName">
            <el-input v-model="formData.nickName" />
          </el-form-item>
          <el-form-item label="登录账号" prop="loginName">
            <el-input v-model="formData.loginName" :disabled="dialogType === 'edit'" />
            <div v-if="dialogType === 'add'" class="form-tip">
              登录名规则: 必须以英文字母开头，只能包含字母、数字、下划线，最小3个字符，最大10个字符
            </div>
          </el-form-item>
          <el-form-item label="手机号" prop="tel">
            <el-input v-model="formData.tel" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="formData.email" />
          </el-form-item>
          <el-form-item label="角色" prop="roles">
            <el-checkbox-group v-model="formData.roleIds">
              <el-checkbox v-for="role in roleOptions" :key="role.id" :value="role.id">
                {{ role.name }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="备注" prop="remarks">
            <el-input v-model="formData.remarks" type="textarea" :rows="3" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">提交</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 权限分配对话框 -->
    <el-dialog v-model="permissionDialog" title="分配用户权限" width="30%">
      <div :style="{ maxHeight: '500px', overflowY: 'scroll' }" v-loading="permissionLoading">
        <permission-tree
          ref="permissionTreeRef"
          :menu-list="menuList"
          :checked-keys="selectedPermissionIds"
          :allow-menu-selection="false"
          @check="handlePermissionCheck"
        />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="permissionDialog = false">取消</el-button>
          <el-button type="primary" @click="saveUserPermissions" :loading="savePermissionLoading">
            保存权限
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { FormInstance } from 'element-plus'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import type { FormRules } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import { UserListParams, UserRecord, AssignUserPermissionParams } from '@/api/model/userModel'
  import { RoleService } from '@/api/roleApi'
  import { Role } from '@/api/model/roleModel'
  import { ApiStatus } from '@/utils/http/status'
  import { formatDate } from '@/utils/date'
  import { onMounted } from 'vue'
  import { useMenuStore } from '@/store/modules/menu'
  import PermissionTree from '@/components/Permission/PermissionTree.vue'
  import { RefreshRight, Operation, Search } from '@element-plus/icons-vue'

  const dialogType = ref('add')
  const dialogVisible = ref(false)
  const loading = ref(false)
  const formLoading = ref(false)
  const submitLoading = ref(false)
  const showSearchWrap = ref(false)

  // 表单数据
  const formData = reactive({
    id: 0,
    nickName: '',
    loginName: '',
    tel: '',
    email: '',
    icon: '',
    roleIds: [] as number[],
    remarks: ''
  })

  // 是否显示搜索区域
  const isShowSearchWrap = () => {
    showSearchWrap.value = !showSearchWrap.value
  }

  // 角色选项
  const roleOptions = ref<Role[]>([])

  // 加载角色选项
  const loadRoleOptions = async () => {
    try {
      const response = await RoleService.getUserAllRoles()
      if (response.code === ApiStatus.success) {
        roleOptions.value = response.data
      } else {
        ElMessage.error(response.message || '获取角色列表失败')
      }
    } catch (error) {
      console.error('获取角色列表失败:', error)
      ElMessage.error('获取角色列表时发生错误')
    }
  }

  const columns = reactive([
    { name: '用户名', show: true },
    { name: '手机号', show: true },
    { name: '登录账号', show: true },
    { name: '角色', show: true },
    { name: '状态', show: true },
    { name: '位置', show: false },
    { name: '更新日期', show: true }
  ])

  const searchFormRef = ref<FormInstance>()
  const searchForm = reactive<UserListParams>({
    loginName: '',
    tel: '',
    email: '',
    location: '',
    page: 1,
    limit: 10
  })

  // 用于列选择
  const colOptions = ref<string[]>([])
  const colSelect = ref<string[]>([])

  // 显示列选择弹出框
  const showPopover = () => {
    if (colSelect.value.length === 0) {
      let ops: string[] = []
      columns.forEach((item: any) => {
        if (item.show) {
          ops.push(item.name)
        }
      })
      colOptions.value = ops

      let allCols: string[] = []
      columns.forEach((item: any) => {
        allCols.push(item.name)
      })
      colSelect.value = allCols
    }
  }

  const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
    // 重置搜索表单的所有字段为空
    Object.keys(searchForm).forEach((key) => {
      if (key !== 'page' && key !== 'limit') {
        if (typeof searchForm[key as keyof UserListParams] === 'string') {
          searchForm[key as keyof UserListParams] = '' as any
        }
      }
    })
    // 重置分页
    searchForm.page = 1
    searchForm.limit = 10
    // 重新加载数据
    loadUserData()
  }

  // 表格数据
  const tableData = ref<UserRecord[]>([])

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 加载用户数据
  const loadUserData = async () => {
    loading.value = true
    try {
      const response = await UserService.getUserList(searchForm)
      if (response.success) {
        tableData.value = response.data.records
        pagination.total = response.data.total
        pagination.current = response.data.current
        pagination.size = response.data.size
        pagination.pages = response.data.pages
      } else {
        ElMessage.error(response.message || '获取用户列表失败')
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      ElMessage.error('获取用户列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 加载用户详情
  const loadUserDetail = async (userId: number) => {
    if (!userId) {
      console.error('无效的用户ID:', userId)
      return
    }

    formLoading.value = true
    try {
      console.log('开始加载用户详情, userId:', userId)
      const response = await UserService.getUserDetail(userId)
      console.log('获取到用户详情响应:', response)

      if (response.code === ApiStatus.success && response.data) {
        const userData = response.data
        console.log('用户详情数据:', userData)

        // 清空之前的数据
        resetFormData()

        // 设置表单数据
        formData.id = userData.id || 0
        formData.nickName = userData.nickName || ''
        formData.loginName = userData.loginName || ''
        formData.tel = userData.tel || ''
        formData.email = userData.email || ''
        formData.icon = userData.icon || ''
        formData.remarks = userData.remarks || ''

        // 设置角色ID列表
        if (userData.roles && Array.isArray(userData.roles)) {
          formData.roleIds = userData.roles.map((role) => role.id)
        } else {
          formData.roleIds = []
        }

        console.log('表单数据设置完成:', JSON.stringify(formData))
      } else {
        ElMessage.error(response.message || '获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      ElMessage.error('获取用户详情时发生错误')
    } finally {
      formLoading.value = false
    }
  }

  // 处理头像URL
  const formatAvatar = (icon: string, userId: number) => {
    if (!icon || icon === '' || !icon.startsWith('http')) {
      return `https://api.dicebear.com/9.x/adventurer/svg?seed=${userId}`
    }
    return icon
  }

  const showDialog = async (type: string, row?: UserRecord) => {
    console.log('showDialog被调用, type:', type, 'row:', row)
    dialogVisible.value = true
    dialogType.value = type

    // 重置表单
    resetFormData()

    // 加载角色选项
    await loadRoleOptions()

    if (type === 'edit' && row) {
      console.log('准备加载用户详情, id:', row.id)
      // 编辑模式：加载用户详情
      await loadUserDetail(row.id)
    }
  }

  // 重置表单数据
  const resetFormData = () => {
    formData.id = 0
    formData.nickName = ''
    formData.loginName = ''
    formData.tel = ''
    formData.email = ''
    formData.icon = ''
    formData.roleIds = []
    formData.remarks = ''
  }

  const deleteUser = (userId: number) => {
    ElMessageBox.confirm('确定要注销该用户吗？', '注销用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(async () => {
      try {
        const response = await UserService.deleteUser(userId)
        if (response.success) {
          ElMessage.success('注销成功')
          loadUserData() // 重新加载数据
        } else {
          ElMessage.error(response.message || '注销失败')
        }
      } catch (error) {
        console.error('注销用户失败:', error)
        ElMessage.error('注销用户失败，请重试')
      }
    })
  }

  const search = () => {
    searchForm.page = 1 // 搜索时重置为第一页
    loadUserData()
  }

  const changeColumn = (show: any, index: number) => {
    columns[index].show = show
  }

  // 处理分页变化
  const handlePageChange = (page: number) => {
    searchForm.page = page
    loadUserData()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    searchForm.limit = size
    searchForm.page = 1 // 切换每页数量时重置为第一页
    loadUserData()
  }

  const rules = reactive<FormRules>({
    nickName: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    loginName: [
      { required: true, message: '请输入登录账号', trigger: 'blur' },
      { min: 3, max: 10, message: '长度在 3 到 10 个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
        message: '必须以英文字母开头，只能包含字母、数字、下划线',
        trigger: 'blur'
      }
    ],
    tel: [{ pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }],
    email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
  })

  const formRef = ref<FormInstance>()

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true

        try {
          let response

          if (dialogType.value === 'add') {
            // 构建新增用户的参数
            const addParams = {
              loginName: formData.loginName,
              nickName: formData.nickName,
              tel: formData.tel,
              email: formData.email,
              icon: formData.icon,
              remarks: formData.remarks,
              roles: formData.roleIds.map((id) => ({ id }))
            }
            response = await UserService.addUser(addParams)
          } else {
            // 构建编辑用户的参数
            const editParams = {
              id: formData.id,
              nickName: formData.nickName,
              tel: formData.tel,
              email: formData.email,
              icon: formData.icon,
              remarks: formData.remarks,
              roleSet: formData.roleIds.map((id) => ({ id }))
            }
            response = await UserService.editUser(editParams)
          }

          if (response.code === ApiStatus.success) {
            ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
            dialogVisible.value = false
            loadUserData() // 操作完成后重新加载数据
          } else {
            ElMessage.error(response.message || '操作失败')
          }
        } catch (error) {
          console.error('保存用户信息失败:', error)
          ElMessage.error('保存用户信息时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 权限树相关
  const permissionDialog = ref(false)
  const permissionLoading = ref(false)
  const savePermissionLoading = ref(false)
  const permissionTreeRef = ref()
  const menuList = computed(() => useMenuStore().getMenuList)
  const selectedPermissionIds = ref<string[]>([])
  const currentUserId = ref<number>(0)

  // 打开权限分配对话框
  const showPermissionDialog = async (row: UserRecord) => {
    permissionDialog.value = true
    currentUserId.value = row.id

    // 加载用户已分配的权限ID
    await loadUserPermissions(row.id)
  }

  // 加载用户已分配的权限
  const loadUserPermissions = async (userId: number) => {
    permissionLoading.value = true
    try {
      const response = await UserService.getAssignedPermissionIds(userId)
      if (response.success) {
        // 获取权限ID并转换为树组件需要的格式（添加p_前缀）
        const permIds = response.data || []
        selectedPermissionIds.value = permIds.map((id) => `p_${id}`)
      } else {
        ElMessage.warning(response.message || '获取用户权限失败')
      }
    } catch (error) {
      console.error('获取用户权限失败:', error)
      ElMessage.error('获取用户权限失败，请重试')
    } finally {
      permissionLoading.value = false
    }
  }

  // 处理权限树节点选择事件
  const handlePermissionCheck = () => {
    // 在这里可以添加逻辑，如果检测到菜单节点被选中，可以发出警告或阻止选择
    // 但PermissionTree组件可能已经处理了事件发送，可能不需要在这里额外处理
  }

  // 保存用户权限设置
  const saveUserPermissions = async () => {
    if (!currentUserId.value) {
      ElMessage.warning('请先选择一个用户')
      return
    }

    savePermissionLoading.value = true
    try {
      // 获取当前选中的所有权限节点ID
      const { checkedKeys } = permissionTreeRef.value?.getCheckedKeys() || { checkedKeys: [] }

      // 从选中的节点中过滤出权限节点（以p_开头的ID）并去除前缀
      const permissionIds = checkedKeys
        .filter((key: string) => typeof key === 'string' && key.startsWith('p_'))
        .map((key: string) => parseInt(key.substring(2)))
        .filter((id: number) => !isNaN(id))

      // 调用保存API
      const params: AssignUserPermissionParams = {
        userId: currentUserId.value,
        permissionIds: permissionIds
      }

      const response = await UserService.assignUserPermission(params)
      if (response.success) {
        ElMessage.success('用户权限分配成功')
        permissionDialog.value = false
      } else {
        ElMessage.error(response.message || '保存失败')
      }
    } catch (error) {
      console.error('保存用户权限失败:', error)
      ElMessage.error('保存用户权限失败，请重试')
    } finally {
      savePermissionLoading.value = false
    }
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadUserData()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;

    .custom-table-bar {
      padding: 0 0 20px;

      .search-container {
        margin-bottom: 20px;
      }

      .search-form {
        width: 100%;
      }

      .search-row {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-end;
        margin: 0 -4px;

        .el-col {
          padding-right: 4px;
          padding-left: 4px;
        }

        .search-buttons {
          display: flex;
          align-items: flex-end;
          margin-bottom: 20px;

          .el-button {
            margin-right: 10px;

            &:last-child {
              margin-right: 0;
            }
          }
        }
      }

      .tool-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    }

    .user {
      .avatar {
        width: 40px;
        height: 40px;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }
      }
    }

    .role-tag {
      margin-right: 5px;
      margin-bottom: 5px;
    }

    .form-tip {
      margin-top: 5px;
      font-size: 12px;
      line-height: 1.4;
      color: #909399;
    }

    .info-alert {
      display: flex;
      align-items: flex-start;
      padding: 10px 15px;
      margin-bottom: 20px;
      background-color: #e6f7ff;
      border: 1px solid #91d5ff;
      border-radius: 4px;

      .info-icon {
        display: flex;
        align-items: center;
        margin-right: 8px;

        i {
          font-size: 20px;
          color: #1890ff;
        }
      }

      .info-content {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: #333;

        p {
          margin: 0;
        }
      }
    }
  }
</style>
