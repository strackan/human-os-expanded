// Session persistence utility to help maintain login state across service restarts
export class SessionPersistence {
  private static readonly SESSION_KEY = 'renubu_session_backup'
  private static readonly USER_KEY = 'renubu_user_backup'
  private static readonly EXPIRY_KEY = 'renubu_session_expiry'
  
  static saveSessionData(user: any, sessionData: any) {
    if (typeof window === 'undefined') return
    
    try {
      const expiryTime = Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
      
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData))
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
      localStorage.setItem(this.EXPIRY_KEY, expiryTime.toString())
      
      console.log('✅ Session data backed up to localStorage')
    } catch (error) {
      console.warn('⚠️ Failed to backup session data:', error)
    }
  }
  
  static getSessionData(): { user: any, sessionData: any } | null {
    if (typeof window === 'undefined') return null
    
    try {
      const expiry = localStorage.getItem(this.EXPIRY_KEY)
      if (!expiry || Date.now() > parseInt(expiry)) {
        this.clearSessionData()
        return null
      }
      
      const user = localStorage.getItem(this.USER_KEY)
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      
      if (user && sessionData) {
        return {
          user: JSON.parse(user),
          sessionData: JSON.parse(sessionData)
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to retrieve session data:', error)
      this.clearSessionData()
    }
    
    return null
  }
  
  static clearSessionData() {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(this.SESSION_KEY)
      localStorage.removeItem(this.USER_KEY)
      localStorage.removeItem(this.EXPIRY_KEY)
      console.log('🧹 Session backup cleared')
    } catch (error) {
      console.warn('⚠️ Failed to clear session data:', error)
    }
  }
  
  static isSessionBackupAvailable(): boolean {
    return this.getSessionData() !== null
  }
  
  static async restoreSession(supabase: any): Promise<boolean> {
    const backup = this.getSessionData()
    if (!backup) return false
    
    try {
      console.log('🔄 Attempting to restore session from backup...')
      
      // Try to refresh the session using the backup data
      const { data, error } = await supabase.auth.setSession({
        access_token: backup.sessionData.access_token,
        refresh_token: backup.sessionData.refresh_token
      })
      
      if (error || !data.session) {
        console.log('⚠️ Session restoration failed, clearing backup')
        this.clearSessionData()
        return false
      }
      
      console.log('✅ Session restored successfully')
      return true
    } catch (error) {
      console.error('❌ Session restoration error:', error)
      this.clearSessionData()
      return false
    }
  }
}