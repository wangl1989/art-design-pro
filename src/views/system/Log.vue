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
              <el-form-item>
                <el-input v-model="queryParams.username" placeholder="请输入用户名搜索"></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item>
                <el-input v-model="queryParams.title" placeholder="请输入日志标题搜索"></el-input>
              </el-form-item>
            </el-col>
            <el-col :xs="19" :sm="12" :lg="6">
              <el-form-item>
                <el-select v-model="queryParams.httpMethod" placeholder="请求类型" clearable>
                  <el-option label="GET" value="GET"></el-option>
                  <el-option label="POST" value="POST"></el-option>
                  <el-option label="PUT" value="PUT"></el-option>
                  <el-option label="DELETE" value="DELETE"></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #bottom>
        <el-button type="danger" @click="handleDelete" v-ripple>批量删除</el-button>
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
      <el-table-column label="操作用户" prop="username" v-if="columns[0].show" />
      <el-table-column label="操作标题" prop="title" v-if="columns[1].show" />
      <el-table-column label="IP地址" prop="remoteAddr" v-if="columns[2].show" />
      <el-table-column label="请求URI" prop="requestUri" v-if="columns[3].show" />
      <el-table-column label="请求方法" prop="httpMethod" v-if="columns[4].show">
        <template #default="scope">
          <el-tag :type="getHttpMethodType(scope.row.httpMethod) as any" size="small">
            {{ scope.row.httpMethod }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="浏览器" prop="browser" v-if="columns[5].show" />
      <el-table-column label="位置" prop="area" v-if="columns[6].show">
        <template #default="scope">
          {{ `${scope.row.province || ''}${scope.row.city ? ' - ' + scope.row.city : ''}` }}
        </template>
      </el-table-column>
      <el-table-column label="请求参数" prop="params" v-if="columns[7].show">
        <template #default="scope">
          <el-button type="primary" link @click="showJsonDialog(scope.row.params, '请求参数')">
            查看请求参数
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="返回数据" prop="response" v-if="columns[8].show">
        <template #default="scope">
          <el-button type="primary" link @click="showJsonDialog(scope.row.response, '返回数据')">
            查看返回数据
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="请求耗时" prop="useTime" v-if="columns[9].show">
        <template #default="scope">
          {{ `${scope.row.useTime}ms` }}
        </template>
      </el-table-column>
      <el-table-column label="异常信息" prop="exception" v-if="columns[10].show">
        <template #default="scope">
          <el-button
            v-if="scope.row.exception"
            type="danger"
            link
            @click="showJsonDialog(scope.row.exception, '异常信息')"
          >
            查看异常
          </el-button>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" prop="createDate" sortable v-if="columns[11].show" />
    </art-table>

    <!-- JSON数据预览对话框 -->
    <el-dialog v-model="jsonDialogVisible" :title="jsonDialogTitle" width="60%">
      <div class="json-viewer">
        <pre v-html="formattedJson"></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { LogService } from '@/api/logApi'
  import { LogRecord, LogListParams } from '@/api/model/logModel'

  // 加载状态
  const loading = ref(false)

  // 日志数据列表
  const logList = ref<LogRecord[]>([])

  // 选中的日志记录
  const selectedLogs = ref<LogRecord[]>([])

  // 列配置
  const columns = reactive([
    { name: '操作用户', show: true },
    { name: '操作标题', show: true },
    { name: 'IP地址', show: true },
    { name: '请求URI', show: true },
    { name: '请求方法', show: true },
    { name: '浏览器', show: true },
    { name: '位置', show: true },
    { name: '请求参数', show: true },
    { name: '返回数据', show: true },
    { name: '请求耗时', show: true },
    { name: '异常信息', show: false },
    { name: '创建时间', show: true }
  ])

  // 查询参数
  const queryParams = reactive<LogListParams>({
    page: 1,
    limit: 10,
    username: '',
    title: '',
    httpMethod: undefined,
    sortByCreateDateAsc: false
  })

  // 分页信息
  const pagination = reactive({
    current: 1,
    size: 10,
    total: 0,
    pages: 0
  })

  // JSON预览对话框
  const jsonDialogVisible = ref(false)
  const jsonDialogTitle = ref('')
  const jsonRawData = ref<any>({})

  // 格式化JSON并添加语法高亮
  const formattedJson = computed(() => {
    try {
      const json =
        typeof jsonRawData.value === 'string' ? JSON.parse(jsonRawData.value) : jsonRawData.value

      const formatted = JSON.stringify(json, null, 2)

      // 简单的语法高亮处理
      return formatted
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(
          /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\\-]?\d+)?)/g,
          (match) => {
            let cls = 'json-number'
            if (/^"/.test(match)) {
              if (/:$/.test(match)) {
                cls = 'json-key'
              } else {
                cls = 'json-string'
              }
            } else if (/true|false/.test(match)) {
              cls = 'json-boolean'
            } else if (/null/.test(match)) {
              cls = 'json-null'
            }
            return `<span class="${cls}">${match}</span>`
          }
        )
    } catch (e) {
      console.error('解析JSON数据失败:', e)
      return typeof jsonRawData.value === 'string'
        ? jsonRawData.value
        : JSON.stringify(jsonRawData.value, null, 2)
    }
  })

  // 展示JSON数据对话框
  const showJsonDialog = (jsonString: string, title: string) => {
    try {
      jsonDialogTitle.value = title
      if (jsonString) {
        jsonRawData.value = jsonString
      } else {
        jsonRawData.value = { 内容: '空数据' }
      }
      jsonDialogVisible.value = true
    } catch (error) {
      console.error('解析JSON数据失败:', error)
      jsonRawData.value = { 内容: jsonString || '无法解析的数据' }
      jsonDialogVisible.value = true
    }
  }

  // 获取HTTP方法对应的标签类型
  const getHttpMethodType = (
    method: string | null
  ): 'success' | 'warning' | 'danger' | 'info' | 'primary' | '' => {
    if (!method) return ''

    const methodMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
      GET: 'success',
      POST: 'primary',
      PUT: 'warning',
      DELETE: 'danger'
    }

    return methodMap[method] || ''
  }

  // 加载日志列表数据
  const loadLogList = async () => {
    loading.value = true
    try {
      const res = await LogService.getLogList(queryParams)
      if (res.success) {
        logList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取日志列表失败')
      }
    } catch (error) {
      console.error('获取日志列表失败:', error)
      ElMessage.error('获取日志列表时发生错误')
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
    queryParams.username = ''
    queryParams.title = ''
    queryParams.httpMethod = undefined
    queryParams.page = 1
    queryParams.limit = 10
    queryParams.sortByCreateDateAsc = false
    loadLogList()
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: LogRecord[]) => {
    selectedLogs.value = selection
  }

  // 处理批量删除
  const handleDelete = () => {
    if (selectedLogs.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要删除选中的日志记录吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const logIds = selectedLogs.value.map((log) => parseInt(log.id))
          const res = await LogService.deleteLog(logIds)
          if (res.success) {
            ElMessage.success('删除成功')
            loadLogList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除日志记录失败:', error)
          ElMessage.error('删除日志记录时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 列显示设置
  const changeColumn = (list: any) => {
    Object.assign(columns, list)
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

  .json-viewer {
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
      word-wrap: break-word;
      white-space: pre-wrap;
    }

    :deep(.json-key) {
      color: #881391;
    }

    :deep(.json-string) {
      color: #1a8b1a;
    }

    :deep(.json-number) {
      color: #1a5fb4;
    }

    :deep(.json-boolean) {
      color: #e95800;
    }

    :deep(.json-null) {
      color: #808080;
    }
  }
</style>
