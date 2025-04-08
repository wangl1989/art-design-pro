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
    >
      <el-form ref="formRef" :model="formData" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="formData.username" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="formData.phone" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-select v-model="formData.sex">
            <el-option label="男" value="男" />
            <el-option label="女" value="女" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="dep">
          <el-select v-model="formData.dep">
            <el-option label="董事会部" :value="1" />
            <el-option label="市场部" :value="2" />
            <el-option label="技术部" :value="3" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">提交</el-button>
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
  import { onMounted } from 'vue'

  const dialogType = ref('add')
  const dialogVisible = ref(false)
  const loading = ref(false)

  const formData = reactive({
    username: '',
    phone: '',
    sex: '',
    dep: ''
  })

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

  const showDialog = (type: string, row?: UserRecord) => {
    dialogVisible.value = true
    dialogType.value = type

    if (type === 'edit' && row) {
      formData.username = row.nickName
      formData.phone = row.tel
      // 其他字段也可以根据需要添加
    } else {
      formData.username = ''
      formData.phone = ''
      formData.sex = '男'
      formData.dep = ''
    }
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
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    phone: [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
    dep: [{ required: true, message: '请选择部门', trigger: 'change' }]
  })

  const formRef = ref<FormInstance>()

  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate((valid) => {
      if (valid) {
        ElMessage.success(dialogType.value === 'add' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        loadUserData() // 操作完成后重新加载数据
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
  }
</style>
