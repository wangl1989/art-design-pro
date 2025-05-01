<template>
  <div class="table-bar">
    <div class="top-wrap" v-show="showSearchWrap">
      <slot name="top"> </slot>
      <div class="buttons">
        <slot name="search-buttons">
          <!-- 如果用户没有提供自定义按钮，则不显示任何内容 -->
        </slot>
      </div>
    </div>
    <div class="bottom-wrap" v-if="showBottom">
      <div class="left-wrap">
        <slot name="bottom"></slot>
      </div>
      <div class="right-wrap">
        <el-button-group>
          <el-button
            :icon="Search"
            @click="isShowSearchWrap()"
            v-if="layout.indexOf('search') !== -1"
          />
          <el-button
            :icon="RefreshRight"
            @click="refresh()"
            v-if="layout.indexOf('refresh') !== -1"
          />

          <el-popover
            placement="bottom-end"
            width="100"
            trigger="hover"
            @show="showPopover"
            @hide="handlePopoverHide"
            v-if="layout.indexOf('column') !== -1"
          >
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
</template>

<script setup lang="ts">
  import { useCommon } from '@/composables/useCommon'
  import { Search, RefreshRight, Operation } from '@element-plus/icons-vue'
  import { nextTick } from 'vue'

  const emit = defineEmits(['search', 'reset', 'changeColumn'])

  const props = defineProps({
    showTop: {
      type: Boolean,
      default: true
    },
    showBottom: {
      type: Boolean,
      default: true
    },
    columns: {
      type: Array,
      default: () => []
    },
    layout: {
      type: String,
      default: 'search, refresh, column'
    }
  })

  const showSearchWrap = ref(true)
  const colOptions = ref([])
  const colSelect = ref([])
  const columnChage = ref(false)

  onMounted(() => {
    showSearchWrap.value = props.showTop
  })

  // 刷新页面
  const refresh = () => {
    useCommon().refresh()
  }

  // 是否显示搜索区域
  const isShowSearchWrap = () => {
    showSearchWrap.value = !showSearchWrap.value
  }

  // 列显示隐藏
  const showPopover = () => {
    if (!columnChage.value) {
      let ops: any = []
      props.columns.map((item: any) => {
        if (item.show) {
          ops.push(item.name)
        }
      })
      colOptions.value = ops

      let allCols: any = []
      props.columns.map((item: any) => {
        allCols.push(item.name)
      })
      colSelect.value = allCols

      columnChage.value = true
    }
  }

  // 选择列
  const changeColumn = (show: any, index: number) => {
    let columns = props.columns

    columns.map((item: any, i: number) => {
      if (index === i) {
        item.show = show
      }
    })

    emit('changeColumn', columns)
  }

  // 供外部调用的搜索方法 - 通过 ref 或在 search-buttons 插槽中使用
  const search = () => {
    emit('search')
  }

  // 供外部调用的重置方法 - 通过 ref 或在 search-buttons 插槽中使用
  const reset = () => {
    emit('reset')
  }

  // 处理 popover 隐藏前清除焦点
  const handlePopoverHide = () => {
    // 确保在 popover 隐藏前，清除内部元素的焦点
    nextTick(() => {
      // 尝试让当前活动元素失焦
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur()
      }

      // 特别处理列设置 popover 中的复选框
      const checkboxes = document.querySelectorAll('.el-checkbox__original')
      checkboxes.forEach((checkbox) => {
        if (checkbox instanceof HTMLElement) {
          checkbox.blur()
        }
      })
    })
  }

  // 暴露方法给外部组件使用
  defineExpose({
    search,
    reset,
    isShowSearchWrap,
    refresh
  })
</script>

<style lang="scss" scoped>
  .table-bar {
    padding: 0 0 20px;

    .top-wrap {
      position: relative;
      transition: height 0.3s;

      .buttons {
        position: absolute;
        right: 0;
        bottom: 20px;
      }
    }

    .bottom-wrap {
      display: flex;
      justify-content: space-between;
    }
  }

  .el-button-group {
    display: flex;
  }

  @media screen and (max-width: $device-phone) {
    .table-bar {
      .top-wrap {
        padding-bottom: 60px;
      }
    }

    .el-form {
      padding-bottom: 15px;
    }
  }
</style>
