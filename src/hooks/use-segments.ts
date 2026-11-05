import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import { deleteSegment, getSegmentsWithPage, updateSegment } from '@/services/dataset'
import type { GetSegmentsWithPageResponse } from '@/models/dataset'

type SegmentItem = GetSegmentsWithPageResponse['data']['list'][number]

const defaultPaginator = {
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
}

export const useGetSegmentsWithPage = (dataset_id: string, document_id: string) => {
  const route = useRoute()
  const loading = ref(false)
  const segments = reactive<SegmentItem[]>([])
  const paginator = reactive({ ...defaultPaginator })

  const loadSegments = async (init: boolean = false) => {
    if (init) {
      Object.assign(paginator, { ...defaultPaginator })
    } else if (paginator.current_page > paginator.total_page) {
      return
    }

    try {
      loading.value = true
      const resp = await getSegmentsWithPage(dataset_id, document_id, {
        current_page: paginator.current_page,
        page_size: paginator.page_size,
        search: String(route.query?.search || ''),
      })
      const data = resp.data

      paginator.current_page = data.paginator.current_page
      paginator.page_size = data.paginator.page_size
      paginator.total_page = data.paginator.total_page
      paginator.total_record = data.paginator.total_record

      if (paginator.current_page <= paginator.total_page) {
        paginator.current_page += 1
      }

      if (init) {
        segments.splice(0, segments.length, ...data.list)
      } else {
        segments.push(...data.list)
      }
    } catch {
      Message.error('加载片段列表失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => {
    await loadSegments(true)
  })

  watch(
    () => route.query?.search,
    async () => {
      await loadSegments(true)
    },
  )

  return { loading, segments, paginator, loadSegments }
}

export const useDeleteSegment = () => {
  const handleDelete = async (
    dataset_id: string,
    document_id: string,
    segment_id: string,
    callback?: () => void,
  ) => {
    Modal.warning({
      title: '要删除该文档片段吗?',
      content:
        '删除文档片段后，知识库/向量数据库将无法检索到该内容，如需暂时关闭可以选择禁用功能。',
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await deleteSegment(dataset_id, document_id, segment_id)
          Message.success(resp.message)
        } catch {
          Message.error('删除失败')
        } finally {
          callback?.()
        }
      },
    })
  }
  return { handleDelete }
}

export const useUpdateSegmentEnabled = () => {
  const handleUpdate = async (
    dataset_id: string,
    document_id: string,
    segment_id: string,
    enabled: boolean,
    callback?: () => void,
  ) => {
    try {
      const resp = await updateSegment(dataset_id, document_id, segment_id, { enabled })
      Message.success(resp.message)
    } catch {
      Message.error('操作失败')
    } finally {
      callback?.()
    }
  }
  return { handleUpdate }
}
