<template>
  <div class="page-content">
    <table-bar
      :showTop="false"
      @search="search"
      @reset="resetQuery"
      @changeColumn="changeColumn"
      :columns="columns"
    >
      <template #top>
        <el-form :model="queryParams" inline>
          <el-row :gutter="15">
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item label="任务名称：">
                <el-input v-model="queryParams.name" placeholder="请输入任务名称搜索"></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item label="任务状态：">
                <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
                  <el-option label="正常" :value="0"></el-option>
                  <el-option label="暂停" :value="1"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button type="primary" @click="handleAdd" v-auth="'quartzjob_add'" v-ripple
          >新增任务</el-button
        >
        <el-button type="danger" @click="handleBatchDelete" v-auth="'quartzjob_delete'" v-ripple
          >批量删除</el-button
        >
        <el-button type="warning" @click="handleBatchPause" v-auth="'quartzjob_pause'" v-ripple
          >批量暂停</el-button
        >
        <el-button type="success" @click="handleBatchResume" v-auth="'quartzjob_resume'" v-ripple
          >批量恢复</el-button
        >
        <el-button type="info" @click="handleBatchRun" v-auth="'quartzjob_run'" v-ripple
          >立即执行</el-button
        >
      </template>
    </table-bar>

    <art-table
      :data="taskList"
      selection
      v-loading="loading"
      pagination
      :currentPage="pagination.current"
      :pageSize="pagination.size"
      :total="pagination.total"
      @current-change="handleCurrentChange"
      @size-change="handleSizeChange"
      @selection-change="handleSelectionChange"
    >
      <el-table-column label="任务组名" prop="groupName" min-width="150" v-if="columns[0].show" />
      <el-table-column label="任务名称" prop="name" min-width="150" v-if="columns[1].show" />
      <el-table-column label="Cron表达式" prop="cron" min-width="150" v-if="columns[2].show" />
      <el-table-column label="目标Bean" prop="targetBean" min-width="180" v-if="columns[3].show" />
      <el-table-column label="目标方法" prop="trgetMethod" min-width="120" v-if="columns[4].show" />
      <el-table-column label="参数" prop="params" min-width="120" v-if="columns[5].show" />
      <el-table-column label="状态" prop="status" width="100" v-if="columns[6].show">
        <template #default="scope">
          <el-tag :type="scope.row.status === 0 ? 'success' : 'warning'" size="small">
            {{ scope.row.status === 0 ? '正常' : '暂停' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column
        label="更新时间"
        prop="updateDate"
        min-width="180"
        sortable
        v-if="columns[6].show"
      />
      <el-table-column label="操作" fixed="right" width="320" v-if="columns[7].show">
        <template #default="scope">
          <el-button type="primary" link v-auth="'quartzjob_edit'" @click="handleEdit(scope.row)"
            >编辑</el-button
          >
          <el-button type="danger" link v-auth="'quartzjob_delete'" @click="handleDelete(scope.row)"
            >删除</el-button
          >
          <el-button
            type="warning"
            link
            v-auth="'quartzjob_pause'"
            v-if="scope.row.status === 0"
            @click="handlePause(scope.row)"
            >暂停</el-button
          >
          <el-button
            type="success"
            link
            v-auth="'quartzjob_resume'"
            v-if="scope.row.status !== 0"
            @click="handleResume(scope.row)"
            >恢复</el-button
          >
          <el-button type="info" link v-auth="'quartzjob_run'" @click="handleRun(scope.row)"
            >执行</el-button
          >
        </template>
      </el-table-column>
    </art-table>

    <!-- 添加/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增定时任务' : '编辑定时任务'"
      width="600px"
      :close-on-click-modal="false"
      :destroy-on-close="true"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
      >
        <el-form-item label="任务组名" prop="groupName">
          <el-input v-model="formData.groupName" placeholder="请输入任务组名" />
        </el-form-item>
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="Cron表达式" prop="cron">
          <el-input v-model="formData.cron" placeholder="请输入Cron表达式" />
        </el-form-item>
        <el-form-item label="目标Bean" prop="targetBean">
          <el-input v-model="formData.targetBean" placeholder="请输入目标Bean名称" />
        </el-form-item>
        <el-form-item label="目标方法" prop="trgetMethod">
          <el-input v-model="formData.trgetMethod" placeholder="请输入目标方法名称" />
        </el-form-item>
        <el-form-item label="执行参数" prop="params">
          <el-input v-model="formData.params" placeholder="请输入执行参数" />
        </el-form-item>
        <el-form-item label="任务状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="0">正常</el-radio>
            <el-radio :value="1">暂停</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remarks">
          <el-input
            v-model="formData.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { QuartzTaskService } from '@/api/quartzTaskApi'
  import {
    QuartzTaskRecordModel,
    QuartzTaskListParams,
    AddQuartzTaskParams,
    EditQuartzTaskParams
  } from '@/api/model/quartzTaskModel'
  import type { FormInstance, FormRules } from 'element-plus'

  // 加载状态
  const loading = ref(false)
  const submitLoading = ref(false)

  // 任务数据列表
  const taskList = ref<QuartzTaskRecordModel[]>([])

  // 选中的任务记录
  const selectedTasks = ref<QuartzTaskRecordModel[]>([])

  // 列配置
  const columns = reactive([
    { name: '任务组名', show: true },
    { name: '任务名称', show: true },
    { name: 'Cron表达式', show: true },
    { name: '目标Bean', show: true },
    { name: '目标方法', show: true },
    { name: '参数', show: true },
    { name: '状态', show: true },
    { name: '创建时间', show: true },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<QuartzTaskListParams>({
    page: 1,
    limit: 10,
    name: '',
    status: undefined,
    sortByCreateDateAsc: false
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 对话框相关
  const dialogVisible = ref(false)
  const dialogType = ref<'add' | 'edit'>('add')
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive<AddQuartzTaskParams & { id?: number }>({
    name: '',
    cron: '',
    groupName: '',
    targetBean: '',
    trgetMethod: '',
    params: '',
    status: 0,
    remarks: ''
  })

  // 表单验证规则
  const formRules = reactive<FormRules>({
    name: [
      { required: true, message: '请输入任务名称', trigger: 'blur' },
      { max: 100, message: '长度不能超过100个字符', trigger: 'blur' }
    ],
    cron: [{ required: true, message: '请输入Cron表达式', trigger: 'blur' }],
    targetBean: [{ required: true, message: '请输入目标Bean', trigger: 'blur' }],
    trgetMethod: [{ required: true, message: '请输入目标方法', trigger: 'blur' }],
    status: [{ required: true, message: '请选择任务状态', trigger: 'change' }]
  })

  // 加载定时任务列表数据
  const loadTaskList = async () => {
    loading.value = true
    try {
      const res = await QuartzTaskService.getQuartzTaskPageList(queryParams)
      if (res.success) {
        taskList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取定时任务列表失败')
      }
    } catch (error) {
      console.error('获取定时任务列表失败:', error)
      ElMessage.error('获取定时任务列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadTaskList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.name = ''
    queryParams.status = undefined
    queryParams.page = 1
    queryParams.limit = 10
    queryParams.sortByCreateDateAsc = false
    loadTaskList()
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: QuartzTaskRecordModel[]) => {
    selectedTasks.value = selection
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadTaskList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadTaskList()
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 处理添加任务
  const handleAdd = () => {
    dialogType.value = 'add'
    resetForm()
    dialogVisible.value = true
  }

  // 处理编辑任务
  const handleEdit = (row: QuartzTaskRecordModel) => {
    dialogType.value = 'edit'
    resetForm()

    // 复制数据到表单
    formData.id = row.id
    formData.name = row.name
    formData.cron = row.cron
    formData.groupName = row.groupName
    formData.targetBean = row.targetBean
    formData.trgetMethod = row.trgetMethod
    formData.params = row.params
    formData.status = row.status
    formData.remarks = row.remarks // API中有此字段但模型中没有对应数据

    dialogVisible.value = true
  }

  // 重置表单
  const resetForm = () => {
    formData.id = undefined
    formData.name = ''
    formData.cron = ''
    formData.targetBean = ''
    formData.groupName = ''
    formData.trgetMethod = ''
    formData.params = ''
    formData.status = 0
    formData.remarks = ''

    // 重置表单验证
    if (formRef.value) {
      formRef.value.resetFields()
    }
  }

  // 提交表单
  const submitForm = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitLoading.value = true
        try {
          let res

          if (dialogType.value === 'add') {
            res = await QuartzTaskService.addQuartzTask(formData)
          } else {
            // 编辑任务
            const editParams: EditQuartzTaskParams = {
              id: formData.id as number,
              name: formData.name,
              cron: formData.cron,
              groupName: formData.groupName,
              targetBean: formData.targetBean,
              trgetMethod: formData.trgetMethod,
              params: formData.params,
              status: formData.status,
              remarks: formData.remarks
            }
            res = await QuartzTaskService.editQuartzTask(editParams)
          }

          if (res.success) {
            ElMessage.success(dialogType.value === 'add' ? '添加成功' : '编辑成功')
            dialogVisible.value = false
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || (dialogType.value === 'add' ? '添加失败' : '编辑失败'))
          }
        } catch (error) {
          console.error(dialogType.value === 'add' ? '添加任务失败:' : '编辑任务失败:', error)
          ElMessage.error(dialogType.value === 'add' ? '添加任务时发生错误' : '编辑任务时发生错误')
        } finally {
          submitLoading.value = false
        }
      }
    })
  }

  // 处理单个删除
  const handleDelete = (row: QuartzTaskRecordModel) => {
    ElMessageBox.confirm(`确定要删除任务 "${row.name}" 吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await QuartzTaskService.deleteQuartzTask([row.id])
          if (res.success) {
            ElMessage.success('删除成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除任务失败:', error)
          ElMessage.error('删除任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedTasks.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要删除选中的任务吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const taskIds = selectedTasks.value.map((task) => task.id)
          const res = await QuartzTaskService.deleteQuartzTask(taskIds)
          if (res.success) {
            ElMessage.success('批量删除成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '批量删除失败')
          }
        } catch (error) {
          console.error('批量删除任务失败:', error)
          ElMessage.error('批量删除任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 暂停单个任务
  const handlePause = (row: QuartzTaskRecordModel) => {
    ElMessageBox.confirm(`确定要暂停任务 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await QuartzTaskService.paushQuartzTask([row.id])
          if (res.success) {
            ElMessage.success('暂停成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '暂停失败')
          }
        } catch (error) {
          console.error('暂停任务失败:', error)
          ElMessage.error('暂停任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 批量暂停任务
  const handleBatchPause = () => {
    if (selectedTasks.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要暂停选中的任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const taskIds = selectedTasks.value.map((task) => task.id)
          const res = await QuartzTaskService.paushQuartzTask(taskIds)
          if (res.success) {
            ElMessage.success('批量暂停成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '批量暂停失败')
          }
        } catch (error) {
          console.error('批量暂停任务失败:', error)
          ElMessage.error('批量暂停任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 恢复单个任务
  const handleResume = (row: QuartzTaskRecordModel) => {
    ElMessageBox.confirm(`确定要恢复任务 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await QuartzTaskService.resumeQuartzTask([row.id])
          if (res.success) {
            ElMessage.success('恢复成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '恢复失败')
          }
        } catch (error) {
          console.error('恢复任务失败:', error)
          ElMessage.error('恢复任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 批量恢复任务
  const handleBatchResume = () => {
    if (selectedTasks.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要恢复选中的任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const taskIds = selectedTasks.value.map((task) => task.id)
          const res = await QuartzTaskService.resumeQuartzTask(taskIds)
          if (res.success) {
            ElMessage.success('批量恢复成功')
            loadTaskList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '批量恢复失败')
          }
        } catch (error) {
          console.error('批量恢复任务失败:', error)
          ElMessage.error('批量恢复任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 执行单个任务
  const handleRun = (row: QuartzTaskRecordModel) => {
    ElMessageBox.confirm(`确定要立即执行任务 "${row.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await QuartzTaskService.runQuartzTask([row.id])
          if (res.success) {
            ElMessage.success('执行成功')
          } else {
            ElMessage.error(res.message || '执行失败')
          }
        } catch (error) {
          console.error('执行任务失败:', error)
          ElMessage.error('执行任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 批量执行任务
  const handleBatchRun = () => {
    if (selectedTasks.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要立即执行选中的任务吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const taskIds = selectedTasks.value.map((task) => task.id)
          const res = await QuartzTaskService.runQuartzTask(taskIds)
          if (res.success) {
            ElMessage.success('批量执行成功')
          } else {
            ElMessage.error(res.message || '批量执行失败')
          }
        } catch (error) {
          console.error('批量执行任务失败:', error)
          ElMessage.error('批量执行任务时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadTaskList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }
</style>
