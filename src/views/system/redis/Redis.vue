<template>
  <div class="page-content">
    <table-bar
      ref="tableBarRef"
      :showTop="false"
      @search="search"
      @reset="resetQuery"
      @changeColumn="changeColumn"
      :columns="columns"
    >
      <template #top>
        <el-form
          :model="queryParams"
          ref="searchFormRef"
          inline
          label-width="90px"
          class="compact-form"
        >
          <el-row :gutter="0">
            <el-col :span="8">
              <el-form-item label="键：">
                <el-input
                  v-model="queryParams.keyPattern"
                  placeholder="请输入key搜索"
                  style="width: 220px"
                ></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="过期时间：">
                <el-switch
                  v-model="queryParams.sortByExpireAsc"
                  active-text="过期时间升序"
                  inactive-text="过期时间降序"
                ></el-switch>
              </el-form-item>
            </el-col>
            <el-col :span="8" class="search-buttons">
              <el-button type="primary" @click="search" v-ripple>搜索</el-button>
              <el-button @click="resetQuery" v-ripple>重置</el-button>
            </el-col>
          </el-row>
        </el-form>
      </template>
      <template #search-buttons>
        <!-- 这里故意留空，按钮已经移到表单内部 -->
      </template>
      <template #bottom>
        <el-button type="danger" @click="handleBatchDelete" v-auth="'redis_batch_delete'" v-ripple
          >批量删除</el-button
        >
      </template>
    </table-bar>

    <art-table
      :data="redisList"
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
      <el-table-column label="键名" prop="key" min-width="250" v-if="columns[0].show" />
      <el-table-column label="类型" prop="type" width="120" v-if="columns[1].show">
        <template #default="scope">
          <el-tag :type="getRedisTypeColor(scope.row.type)" size="small">
            {{ scope.row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="TTL" prop="ttl" width="120" v-if="columns[2].show">
        <template #default="scope">
          <span v-if="scope.row.ttl === -1">永不过期</span>
          <span v-else-if="scope.row.ttl === -2">已过期</span>
          <span v-else>{{ formatTTL(scope.row.ttl) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="值" prop="value" min-width="180" v-if="columns[3].show">
        <template #default="scope">
          <el-button
            type="primary"
            v-auth="'redis_show_value'"
            link
            @click="showJsonDialog(scope.row.value, '键值数据')"
          >
            查看值
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" width="120" v-if="columns[4].show">
        <template #default="scope">
          <el-button type="danger" v-auth="'redis_delete'" link @click="handleDelete(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </art-table>

    <!-- JSON数据预览对话框 -->
    <el-dialog v-model="jsonDialogVisible" :title="jsonDialogTitle" width="60%">
      <div v-if="isDataTooLarge" class="data-size-warning">
        <el-alert
          :title="`数据较大 (${(dataSize / 1024).toFixed(2)} KB)，可能影响浏览器性能`"
          type="warning"
          :closable="false"
        >
          <template #default>
            <el-button size="small" @click="toggleFullData" type="primary">
              {{ isFullData ? '显示部分数据' : '显示完整数据' }}
            </el-button>
          </template>
        </el-alert>
      </div>
      <div class="json-viewer">
        <pre v-html="formattedJson"></pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted, computed } from 'vue'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { RedisApi } from '@/api/redisApi'
  import { RedisRecordModel, RedisListParam } from '@/api/model/redisModel'
  import type { FormInstance } from 'element-plus'

  // 表格栏引用
  const tableBarRef = ref()
  // 搜索表单引用
  const searchFormRef = ref<FormInstance>()

  // 加载状态
  const loading = ref(false)

  // Redis数据列表
  const redisList = ref<RedisRecordModel[]>([])

  // 选中的记录
  const selectedRedisRecords = ref<RedisRecordModel[]>([])

  // 列配置
  const columns = reactive([
    { name: '键名', show: true },
    { name: '类型', show: true },
    { name: 'TTL', show: true },
    { name: '值', show: true },
    { name: '操作', show: true }
  ])

  // 查询参数
  const queryParams = reactive<RedisListParam>({
    page: 1,
    limit: 10,
    keyPattern: '',
    sortByExpireAsc: false
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
  const isFullData = ref(false)
  const isDataTooLarge = ref(false)
  const dataSize = ref(0)
  const MAX_SAFE_SIZE = 10000 // 字符数限制，超过则截断

  // 获取Redis类型对应的标签颜色
  const getRedisTypeColor = (
    type: string
  ): 'success' | 'warning' | 'danger' | 'info' | 'primary' => {
    const typeMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'primary'> = {
      string: 'success',
      list: 'primary',
      hash: 'warning',
      set: 'info',
      zset: 'danger'
    }

    return typeMap[type] || 'info' // 使用'info'作为默认类型
  }

  // 格式化TTL显示
  const formatTTL = (ttl: number): string => {
    if (ttl < 60) {
      return `${ttl}秒`
    } else if (ttl < 3600) {
      return `${Math.floor(ttl / 60)}分钟${ttl % 60}秒`
    } else if (ttl < 86400) {
      return `${Math.floor(ttl / 3600)}小时${Math.floor((ttl % 3600) / 60)}分钟`
    } else {
      return `${Math.floor(ttl / 86400)}天${Math.floor((ttl % 86400) / 3600)}小时`
    }
  }

  // 展示JSON数据对话框
  const showJsonDialog = (value: string, title: string) => {
    try {
      jsonDialogTitle.value = title
      jsonRawData.value = value || { 内容: '空数据' }

      // 计算数据大小
      const strValue = typeof value === 'string' ? value : JSON.stringify(value || {})
      dataSize.value = strValue.length
      isDataTooLarge.value = dataSize.value > MAX_SAFE_SIZE
      isFullData.value = false // 重置为截断模式

      jsonDialogVisible.value = true
    } catch (error) {
      console.error('处理数据失败:', error)
      jsonRawData.value = { 内容: value || '无法解析的数据' }
      jsonDialogVisible.value = true
    }
  }

  // 切换完整数据查看
  const toggleFullData = () => {
    isFullData.value = !isFullData.value
  }

  // 格式化JSON并添加语法高亮
  const formattedJson = computed(() => {
    try {
      let json
      let jsonString = ''

      try {
        if (typeof jsonRawData.value === 'string') {
          // 如果数据过大且用户未选择查看完整数据，则截断
          if (isDataTooLarge.value && !isFullData.value) {
            jsonString = jsonRawData.value.substring(0, MAX_SAFE_SIZE)
            json = JSON.parse(jsonString)
          } else {
            jsonString = jsonRawData.value
            json = JSON.parse(jsonString)
          }
        } else {
          json = jsonRawData.value
          jsonString = JSON.stringify(json)

          if (isDataTooLarge.value && !isFullData.value) {
            jsonString = jsonString.substring(0, MAX_SAFE_SIZE)
            json = JSON.parse(jsonString)
          }
        }
      } catch {
        // 如果不是有效的JSON格式，直接显示原始内容
        if (typeof jsonRawData.value === 'string') {
          if (isDataTooLarge.value && !isFullData.value) {
            return jsonRawData.value.substring(0, MAX_SAFE_SIZE) + '...(数据已截断)'
          }
          return jsonRawData.value
        } else {
          const str = JSON.stringify(jsonRawData.value, null, 2)
          if (isDataTooLarge.value && !isFullData.value) {
            return str.substring(0, MAX_SAFE_SIZE) + '...(数据已截断)'
          }
          return str
        }
      }

      // 格式化和高亮处理
      let formatted = JSON.stringify(json, null, 2)

      // 对于大型数据，简化高亮处理以提高性能
      if (isDataTooLarge.value) {
        return formatted + (isFullData.value ? '' : '...(数据已截断)')
      }

      // 小型数据才进行全量的语法高亮处理
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
      if (typeof jsonRawData.value === 'string') {
        const value = jsonRawData.value
        if (isDataTooLarge.value && !isFullData.value) {
          return value.substring(0, MAX_SAFE_SIZE) + '...(数据已截断)'
        }
        return value
      }
      return JSON.stringify(jsonRawData.value, null, 2)
    }
  })

  // 加载Redis列表数据
  const loadRedisList = async () => {
    loading.value = true
    try {
      const res = await RedisApi.getRedisRecord(queryParams)
      if (res.success) {
        redisList.value = res.data.records
        pagination.total = res.data.total
        pagination.current = res.data.current
        pagination.size = res.data.size
        pagination.pages = res.data.pages
      } else {
        ElMessage.error(res.message || '获取Redis列表失败')
      }
    } catch (error) {
      console.error('获取Redis列表失败:', error)
      ElMessage.error('获取Redis列表时发生错误')
    } finally {
      loading.value = false
    }
  }

  // 搜索
  const search = () => {
    queryParams.page = 1 // 搜索时重置为第一页
    loadRedisList()
  }

  // 重置查询
  const resetQuery = () => {
    queryParams.keyPattern = ''
    queryParams.sortByExpireAsc = false
    queryParams.page = 1
    queryParams.limit = 10
    loadRedisList()
  }

  // 监听选中行变化
  const handleSelectionChange = (selection: RedisRecordModel[]) => {
    selectedRedisRecords.value = selection
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRedisRecords.value.length === 0) {
      ElMessage.warning('请至少选择一条记录')
      return
    }

    ElMessageBox.confirm('确定要删除选中的Redis键吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const deletePromises = selectedRedisRecords.value.map((record) =>
            RedisApi.deleteRedisRecord(record.key)
          )

          const results = await Promise.all(deletePromises)
          const success = results.every((res) => res.success)

          if (success) {
            ElMessage.success('批量删除成功')
            loadRedisList() // 重新加载数据
          } else {
            ElMessage.error('部分或全部删除失败，请重试')
          }
        } catch (error) {
          console.error('批量删除Redis记录失败:', error)
          ElMessage.error('批量删除Redis记录时发生错误')
        }
      })
      .catch(() => {
        // 用户取消操作
      })
  }

  // 处理单个删除
  const handleDelete = (row: RedisRecordModel) => {
    ElMessageBox.confirm(`确定要删除Redis键 "${row.key}" 吗？此操作不可恢复！`, '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await RedisApi.deleteRedisRecord(row.key)
          if (res.success) {
            ElMessage.success('删除成功')
            loadRedisList() // 重新加载数据
          } else {
            ElMessage.error(res.message || '删除失败')
          }
        } catch (error) {
          console.error('删除Redis记录失败:', error)
          ElMessage.error('删除Redis记录时发生错误')
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
    loadRedisList()
  }

  // 处理每页显示数量变化
  const handleSizeChange = (size: number) => {
    queryParams.limit = size
    queryParams.page = 1 // 切换每页数量时重置为第一页
    loadRedisList()
  }

  // 组件挂载时加载数据
  onMounted(() => {
    loadRedisList()
  })
</script>

<style lang="scss" scoped>
  .page-content {
    width: 100%;
    height: 100%;
  }

  .search-buttons {
    display: flex;
    align-items: center;
    height: 32px;
    margin-top: 4px;

    .el-button {
      margin-right: 10px;

      &:last-child {
        margin-right: 0;
      }
    }
  }

  .compact-form {
    .el-form-item {
      margin-right: 0;
      margin-bottom: 18px;
    }
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

  .data-size-warning {
    margin-bottom: 10px;
  }
</style>
