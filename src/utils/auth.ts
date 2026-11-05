import { useCredentialStore } from '@/stores/credential'

export default {
  isLogin: (): boolean => {
    const { credential } = useCredentialStore()
    const now = Math.floor(Date.now() / 1000)
    if (!credential.access_token || !credential.expire_at || credential.expire_at < now) {
      return false
    }
    return true
  },
}
