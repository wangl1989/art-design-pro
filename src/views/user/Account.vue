<template>
  <div class="page-content">
    <table-bar
      :showTop="false"
      @search="search"
      @reset="resetForm(searchFormRef)"
      @changeColumn="changeColumn"
      :columns="columns"
    >
      <template #top>
        <el-form :model="searchForm" ref="searchFormRef" label-width="82px">
          <el-row :gutter="20">
            <form-input
              label="登录账号"
              prop="loginName"
              v-model="searchForm.loginName as string"
            />
            <form-input label="手机号" prop="tel" v-model="searchForm.tel as string" />
            <form-input label="邮箱" prop="email" v-model="searchForm.email as string" />
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button @click="showDialog('add')" v-ripple>添加用户</el-button>
      </template>
    </table-bar>

    <art-table
      :data="tableData"
      selection
      :currentPage="pagination.current"
      :pageSize="pagination.size"
      :total="pagination.total"
      @page-change="handlePageChange"
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
        <el-table-column label="创建日期" prop="createDate" sortable v-if="columns[5].show">
          <template #default="scope">
            {{ formatDate(scope.row.createDate) }}
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="150px">
          <template #default="scope">
            <button-table type="edit" @click="showDialog('edit', scope.row)" />
            <button-table type="delete" @click="deleteUser" />
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
  </div>
</template>

<script setup lang="ts">
  import { FormInstance } from 'element-plus'
  import { ElMessageBox, ElMessage } from 'element-plus'
  import type { FormRules } from 'element-plus'
  import { UserService } from '@/api/usersApi'
  import { UserListParams, UserRecord } from '@/api/model/userModel'
  import { RoleService } from '@/api/roleApi'
  import { Role } from '@/api/model/roleModel'
  import { ApiStatus } from '@/utils/http/status'
  import { onMounted } from 'vue'

  const dialogType = ref('add')
  const dialogVisible = ref(false)
  const loading = ref(false)
  const formLoading = ref(false)
  const submitLoading = ref(false)

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
    { name: '创建日期', show: true }
  ])

  const searchFormRef = ref<FormInstance>()
  const searchForm = reactive<UserListParams>({
    loginName: '',
    tel: '',
    email: '',
    page: 1,
    limit: 10
  })

  const resetForm = (formEl: FormInstance | undefined) => {
    if (!formEl) return
    formEl.resetFields()
    searchForm.page = 1
    searchForm.limit = 10
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

  // 格式化日期
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
    } catch (error) {
      console.error('格式化日期失败:', error)
      return dateStr
    }
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

  const deleteUser = () => {
    ElMessageBox.confirm('确定要注销该用户吗？', '注销用户', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    }).then(() => {
      ElMessage.success('注销成功')
      loadUserData() // 重新加载数据
    })
  }

  const search = () => {
    searchForm.page = 1 // 搜索时重置为第一页
    loadUserData()
  }

  const changeColumn = (list: any) => {
    columns.values = list
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
    tel: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    email: [
      { required: true, message: '请输入邮箱', trigger: 'blur' },
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ]
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

  // 组件挂载时加载数据
  onMounted(() => {
    loadUserData()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;

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
