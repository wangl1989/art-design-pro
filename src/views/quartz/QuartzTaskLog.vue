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
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button type="danger" @click="handleBatchDelete" v-ripple>批量删除</el-button>
      </template>
    </table-bar>

    <art-table
      :data="logList"
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
      <el-table-column label="任务ID" prop="jobId" width="100" v-if="columns[0].show" />
      <el-table-column label="任务名称" prop="name" min-width="150" v-if="columns[1].show" />
      <el-table-column label="Cron表达式" prop="cron" min-width="150" v-if="columns[2].show" />
      <el-table-column label="目标Bean" prop="targetBean" min-width="180" v-if="columns[3].show" />
      <el-table-column label="目标方法" prop="trgetMethod" min-width="120" v-if="columns[4].show" />
      <el-table-column label="参数" prop="params" min-width="120" v-if="columns[5].show" />
      <el-table-column label="状态" prop="status" width="100" v-if="columns[6].show">
        <template #default="scope">
          <el-tag :type="getTaskStatusType(scope.row.status)" size="small">
            {{ getTaskStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="执行耗时" prop="times" min-width="120" v-if="columns[7].show">
        <template #default="scope">
          {{ `${scope.row.times || 0}ms` }}
        </template>
      </el-table-column>
      <el-table-column label="异常信息" prop="error" min-width="180" v-if="columns[8].show">
        <template #default="scope">
          <el-button
            v-if="scope.row.error"
            type="danger"
            link
            @click="showErrorDialog(scope.row.error)"
          >
            查看异常
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column
        label="创建时间"
        prop="createDate"
        min-width="180"
        sortable
        v-if="columns[9].show"
      />
      <el-table-column label="操作" fixed="right" width="100" v-if="columns[10].show">
        <template #default="scope">
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </art-table>

    <!-- 异常信息对话框 -->
    <el-dialog v-model="errorDialogVisible" title="异常信息详情" width="60%">
      <div class="error-content">
        <pre>{{ currentError }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { QuartzTaskLogService } from '@/api/quartzTaskLogApi'
  import {
    QuartzTaskRecordModel,
    QuartzTaskLogListParams,
    getTaskStatusText,
    getTaskStatusType
  } from '@/api/model/quartzTaskLogModel'

  // 加载状态
  const loading = ref(false)

  // 日志数据列表
  const logList = ref<QuartzTaskRecordModel[]>([])

  // 选中的日志记录
  const selectedLogs = ref<QuartzTaskRecordModel[]>([])

  // 列配置
  const columns = reactive([
    { name: '任务ID', show: true },
    { name: '任务名称', show: true },
    { name: 'Cron表达式', show: true },
    { name: '目标Bean', show: true },
    { name: '目标方法', show: true },
    { name: '参数', show: true },
    { name: '状态', show: true },
    { name: '执行耗时', show: true },
    { name: '异常信息', show: true },
    { name: '创建时间', show: true },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<QuartzTaskLogListParams>({
    page: 1,
    limit: 10,
    name: undefined,
    sortByCreateDateAsc: false
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // 异常信息对话框
  const errorDialogVisible = ref(false)
  const currentError = ref('')

  // 显示异常信息对话框
  const showErrorDialog = (error: string) => {
    currentError.value = error
    errorDialogVisible.value = true
  }

  // 加载定时任务日志列表数据
  const loadLogList = async () => {
    loading.value = true
    try {
      const res = await QuartzTaskLogService.getQuartzTaskLogPageList(queryParams)
      if (res.success) {
        logList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取定时任务日志列表失败')
      }
    } catch (error) {
      console.error('获取定时任务日志列表失败:', error)
      ElMessage.error('获取定时任务日志列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadLogList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.name = undefined
    queryParams.page = 1
    queryParams.limit = 10
    queryParams.sortByCreateDateAsc = false
    loadLogList()
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: QuartzTaskRecordModel[]) => {
    selectedLogs.value = selection
  }

  // 处理分页变化
  const handleCurrentChange = (page: number) => {
    queryParams.page = page
    loadLogList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadLogList()
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
  }

  // 处理单个删除
  const handleDelete = (row: QuartzTaskRecordModel) => {
    ElMessageBox.confirm(`确定要删除任务日志吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await QuartzTaskLogService.deleteQuartzTaskLog({ id: row.id })
          if (res.success) {
            ElMessage.success('删除成功')
            loadLogList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除任务日志失败:', error)
          ElMessage.error('删除任务日志时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedLogs.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要删除选中的任务日志吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          // 注意：当前API只支持单个删除，这里进行遍历删除
          const deletePromises = selectedLogs.value.map((log) =>
            QuartzTaskLogService.deleteQuartzTaskLog({ id: log.id })
          )

          const results = await Promise.all(deletePromises)
          const success = results.every((res) => res.success)

          if (success) {
            ElMessage.success('批量删除成功')
            loadLogList() // 重新加载数据
          } else {
            ElMessage.error('部分或全部删除失败，请重试')
          }
        } catch (error) {
          console.error('批量删除任务日志失败:', error)
          ElMessage.error('批量删除任务日志时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadLogList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .error-content {
    max-height: 60vh;
    padding: 10px;
    overflow-y: auto;
    background-color: #f8f8f8;
    border-radius: 4px;

    pre {
      margin: 0;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.5;
      color: #d63031;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
  }
</style>
