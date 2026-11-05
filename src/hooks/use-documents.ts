import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Message, Modal } from '@arco-design/web-vue'
import {
  deleteDocument,
  getDocument,
  getDocumentsWithPage,
  updateDocument,
} from '@/services/dataset'
import type { GetDocumentsWithPageResponse, GetDocumentResponse } from '@/models/dataset'

type DocumentItem = GetDocumentsWithPageResponse['data']['list'][number]

const defaultPaginator = {
  current_page: 1,
  page_size: 20,
  total_page: 0,
  total_record: 0,
}

export const useGetDocumentsWithPage = (dataset_id: string) => {
  const route = useRoute()
  const loading = ref(false)
  const documents = reactive<DocumentItem[]>([])
  const paginator = reactive({ ...defaultPaginator })

  const loadDocuments = async (init: boolean = false) => {
    if (!init && paginator.current_page > paginator.total_page) return

    try {
      loading.value = true
      const resp = await getDocumentsWithPage(dataset_id, {
        current_page: (route.query?.current_page || 1) as number,
        page_size: (route.query?.page_size || 20) as number,
        search: (route.query?.search || '') as string,
      })
      const data = resp.data

      paginator.current_page = data.paginator.current_page
      paginator.page_size = data.paginator.page_size
      paginator.total_page = data.paginator.total_page
      paginator.total_record = data.paginator.total_record

      documents.splice(0, documents.length, ...data.list)
    } catch {
      Message.error('加载文档列表失败')
    } finally {
      loading.value = false
    }
  }

  const initPaginator = () => {
    Object.assign(paginator, { ...defaultPaginator })
  }

  onMounted(async () => {
    await loadDocuments(true)
  })

  watch(
    () => route.query,
    async (newQuery, oldQuery) => {
      if (newQuery.search !== oldQuery?.search) {
        initPaginator()
        await loadDocuments(true)
      } else if (newQuery.current_page != oldQuery?.current_page) {
        await loadDocuments()
      }
    },
  )

  return { loading, documents, paginator, loadDocuments }
}

export const useDeleteDocument = () => {
  const handleDelete = (dataset_id: string, document_id: string, callback?: () => void) => {
    Modal.warning({
      title: '要删除该文档吗?',
      content:
        '删除文档后，知识库/向量数据库将无法检索到该文档，如需暂时关闭该文档的检索，可以选择禁用功能',
      hideCancel: false,
      onOk: async () => {
        try {
          const resp = await deleteDocument(dataset_id, document_id)
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

export const useUpdateDocumentEnabled = () => {
  const handleUpdate = async (
    dataset_id: string,
    document_id: string,
    enabled: boolean,
    callback?: () => void,
  ) => {
    try {
      const resp = await updateDocument(dataset_id, document_id, { enabled })
      Message.success(resp.message)
    } catch {
      Message.error('操作失败')
    } finally {
      callback?.()
    }
  }
  return { handleUpdate }
}

export const useGetDocument = (dataset_id: string, document_id: string) => {
  const loading = ref(false)
  const document = reactive<GetDocumentResponse['data']>({
    id: '',
    dataset_id: '',
    name: '',
    segment_count: 0,
    character_count: 0,
    token_count: 0,
    hit_count: 0,
    position: 0,
    enabled: false,
    disabled_at: null,
    status: '',
    error: '',
    created_at: '',
    updated_at: null,
  })

  const loadDocument = async (ds_id: string, doc_id: string) => {
    try {
      loading.value = true
      const resp = await getDocument(ds_id, doc_id)
      Object.assign(document, { ...resp.data })
    } catch {
      Message.error('加载文档详情失败')
    } finally {
      loading.value = false
    }
  }

  onMounted(async () => await loadDocument(dataset_id, document_id))

  return { loading, document, loadDocument }
}
