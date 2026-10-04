import { useEffect, useRef, useState } from 'react'

import {
  Bell,
  CheckCheck,
  X,
  History,
} from 'lucide-react'

import { useLocation, useNavigate } from 'react-router-dom'

import api from '../../services/api'


function NotificationBell() {
  // =========================================================
  // ROUTER
  // =========================================================

  const navigate = useNavigate()
  const location = useLocation()


  // =========================================================
  // STATE
  // =========================================================

  const [notifications, setNotifications] =
    useState([])

  const [unreadCount, setUnreadCount] =
    useState(0)

  const [open, setOpen] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [actionLoading, setActionLoading] =
    useState(false)

  const [error, setError] =
    useState('')

  const containerRef =
    useRef(null)


  // =========================================================
  // LOAD UNREAD COUNT
  // =========================================================

  async function loadUnreadCount() {
    try {
      const response = await api.get(
        '/notifications/unread-count'
      )

      const count = Number(
        response.data?.unread_count ?? 0
      )

      setUnreadCount(
        Number.isFinite(count) && count >= 0
          ? count
          : 0
      )

    } catch (err) {
      console.error(
        'Failed to load notification count:',
        err
      )

      if (
        err.response?.status === 401 ||
        err.response?.status === 403
      ) {
        setUnreadCount(0)
      }
    }
  }


  // =========================================================
  // LOAD NOTIFICATIONS
  // =========================================================

  async function loadNotifications() {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        '/notifications'
      )

      /*
       * Backend may return:
       *
       * [
       *   notification,
       *   notification
       * ]
       *
       * OR:
       *
       * {
       *   notifications: [...]
       * }
       */

      const data = Array.isArray(
        response.data
      )
        ? response.data
        : Array.isArray(
            response.data?.notifications
          )
          ? response.data.notifications
          : []

      /*
       * The bell is intentionally a preview.
       *
       * Full history belongs on the
       * Notification History page.
       */

      const latestNotifications =
        data
          .slice()
          .sort(
            (a, b) =>
              Number(b.id || 0) -
              Number(a.id || 0)
          )
          .slice(0, 5)

      setNotifications(
        latestNotifications
      )

      await loadUnreadCount()

    } catch (err) {
      console.error(
        'Failed to load notifications:',
        err
      )

      if (
        err.response?.status === 401
      ) {
        setError(
          'Your session has expired. Please sign in again.'
        )

      } else if (
        err.response?.status === 403
      ) {
        setError(
          'You do not have permission to view notifications.'
        )

      } else {
        setError(
          err.response?.data?.detail ||
            'Unable to load notifications.'
        )
      }

    } finally {
      setLoading(false)
    }
  }


  // =========================================================
  // OPEN / CLOSE
  // =========================================================

  async function handleOpen() {
    const nextOpen = !open

    setOpen(nextOpen)

    if (nextOpen) {
      await loadNotifications()
    }
  }


  function closeNotifications() {
    setOpen(false)
  }


  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  async function markAsRead(
    notificationId
  ) {
    if (!notificationId) {
      return
    }

    const selectedNotification =
      notifications.find(
        (notification) =>
          notification.id ===
          notificationId
      )

    if (
      !selectedNotification ||
      selectedNotification.is_read
    ) {
      return
    }

    try {
      setActionLoading(true)

      await api.patch(
        `/notifications/${notificationId}/read`
      )

      setNotifications((current) =>
        current.map((notification) =>
          notification.id ===
          notificationId
            ? {
                ...notification,
                is_read: true,
              }
            : notification
        )
      )

      await loadUnreadCount()

    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      )

      setError(
        err.response?.data?.detail ||
          'Unable to mark notification as read.'
      )

    } finally {
      setActionLoading(false)
    }
  }


  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async function markAllAsRead() {
    if (unreadCount <= 0) {
      return
    }

    try {
      setActionLoading(true)
      setError('')

      await api.patch(
        '/notifications/read-all'
      )

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      )

      await loadUnreadCount()

    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      )

      setError(
        err.response?.data?.detail ||
          'Unable to mark all notifications as read.'
      )

    } finally {
      setActionLoading(false)
    }
  }


  // =========================================================
  // OPEN NOTIFICATION HISTORY
  // =========================================================

  function openNotificationHistory() {
    setOpen(false)

    navigate('/notifications')
  }


  // =========================================================
  // INITIAL LOAD + POLLING
  // =========================================================

  useEffect(() => {
    loadUnreadCount()

    const interval =
      setInterval(
        loadUnreadCount,
        30000
      )

    return () => {
      clearInterval(interval)
    }
  }, [])


  // =========================================================
  // REFRESH OPEN PANEL
  // =========================================================

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const interval =
      setInterval(
        loadNotifications,
        30000
      )

    return () => {
      clearInterval(interval)
    }
  }, [open])


  // =========================================================
  // CLOSE WHEN CLICKING OUTSIDE
  // =========================================================

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target
        )
      ) {
        setOpen(false)
      }
    }


    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }


    document.addEventListener(
      'mousedown',
      handleOutsideClick
    )

    document.addEventListener(
      'keydown',
      handleEscape
    )


    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick
      )

      document.removeEventListener(
        'keydown',
        handleEscape
      )
    }
  }, [])


  // =========================================================
  // FORMAT DATE — IST
  // =========================================================

  function formatDate(value) {
    if (!value) {
      return ''
    }

    let rawValue =
      String(value).trim()


    /*
     * Backend timestamps currently look like:
     *
     * 2026-10-01 14:30:39
     *
     * They have no timezone suffix.
     *
     * We therefore explicitly interpret them
     * as UTC before converting to IST.
     */

    const hasTimezone =
      /(?:Z|[+-]\d{2}:?\d{2})$/i.test(
        rawValue
      )


    if (!hasTimezone) {
      rawValue =
        rawValue.replace(
          ' ',
          'T'
        )

      rawValue += 'Z'
    }


    const date =
      new Date(rawValue)


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return ''
    }


    return date.toLocaleString(
      'en-IN',
      {
        timeZone:
          'Asia/Kolkata',

        day: '2-digit',
        month: 'short',
        year: 'numeric',

        hour: '2-digit',
        minute: '2-digit',

        hour12: true,
      }
    )
  }


  // =========================================================
  // EXTRACT JOB TITLE
  // =========================================================

  function extractJobTitle(
    notification
  ) {
    if (!notification) {
      return ''
    }


    if (
      notification.job_title
    ) {
      return String(
        notification.job_title
      ).trim()
    }


    if (
      notification.job?.title
    ) {
      return String(
        notification.job.title
      ).trim()
    }


    const message =
      String(
        notification.message || ''
      )


    const patterns = [
      /posted a new job '([^']+)'/i,
      /job '([^']+)'/i,
      /application for '([^']+)'/i,
    ]


    for (
      const pattern of patterns
    ) {
      const match =
        message.match(pattern)

      if (
        match?.[1]
      ) {
        return match[1].trim()
      }
    }


    return ''
  }


  // =========================================================
  // GET NOTIFICATION TARGET
  // =========================================================

  function getNotificationTarget(
    notification
  ) {
    if (!notification) {
      return null
    }


    /*
     * If backend eventually provides
     * an explicit link, use it.
     */

    const explicitLink =
      notification.link ||
      notification.url ||
      notification.target_url ||
      notification.path


    if (
      typeof explicitLink ===
        'string' &&
      explicitLink.trim() &&
      explicitLink.startsWith('/')
    ) {
      return explicitLink.trim()
    }


    const type =
      String(
        notification.notification_type ||
          notification.type ||
          ''
      ).toLowerCase()


    const currentPath =
      location.pathname || ''


    const isCandidate =
      currentPath.startsWith(
        '/candidate'
      )


    const isRecruiter =
      currentPath.startsWith(
        '/recruiter'
      )


    const isPlacementOfficer =
      currentPath.startsWith(
        '/placement-officer'
      )


    const jobTitle =
      extractJobTitle(
        notification
      )


    const encodedJobTitle =
      jobTitle
        ? encodeURIComponent(
            jobTitle
          )
        : ''


    // ---------------------------------------------------------
    // CANDIDATE
    // ---------------------------------------------------------

    if (isCandidate) {
      switch (type) {

        case 'application_submitted':
        case 'application_status':
        case 'application_updated':
        case 'new_application':
          return '/candidate/applications'


        case 'new_job':
        case 'job_updated':

          if (
            encodedJobTitle
          ) {
            return `/candidate/jobs?search=${encodedJobTitle}`
          }

          return '/candidate/jobs'


        default:
          return '/candidate'
      }
    }


    // ---------------------------------------------------------
    // RECRUITER
    // ---------------------------------------------------------

    if (isRecruiter) {
      switch (type) {

        case 'new_application':
        case 'application_status':
        case 'application_updated':
        case 'application_submitted':
          return '/recruiter/applications'


        case 'new_job':
        case 'job_updated':

          if (
            encodedJobTitle
          ) {
            return `/recruiter/jobs?search=${encodedJobTitle}`
          }

          return '/recruiter/jobs'


        default:
          return '/recruiter'
      }
    }


    // ---------------------------------------------------------
    // PLACEMENT OFFICER
    // ---------------------------------------------------------

    if (
      isPlacementOfficer
    ) {
      switch (type) {

        case 'new_application':
        case 'application_status':
        case 'application_updated':
        case 'application_submitted':
          return '/placement-officer/applications'


        case 'new_job':
        case 'job_updated':
          return '/placement-officer'


        default:
          return '/placement-officer'
      }
    }


    return '/'
  }


  // =========================================================
  // NOTIFICATION CLICK
  // =========================================================

  async function handleNotificationClick(
    notification
  ) {
    if (!notification) {
      return
    }


    if (
      !notification.is_read
    ) {
      await markAsRead(
        notification.id
      )
    }


    setOpen(false)


    const target =
      getNotificationTarget(
        notification
      )


    if (
      target
    ) {
      navigate(target)
    }
  }


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div
      className="hs-notification-container"
      ref={containerRef}
    >

      {/* =====================================================
          BELL
      ====================================================== */}

      <button
        type="button"

        className="hs-icon-button hs-notification-button"

        aria-label={
          unreadCount > 0
            ? `${unreadCount} unread notifications`
            : 'Notifications'
        }

        title="Notifications"

        onClick={handleOpen}
      >

        <Bell size={19} />

        {unreadCount > 0 && (
          <span
            className="hs-notification-badge"
          >
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}

      </button>


      {/* =====================================================
          PANEL
      ====================================================== */}

      {open && (
        <div
          className="hs-notification-panel"
          role="dialog"
          aria-label="Notifications"
        >

          {/* =================================================
              HEADER
          ================================================== */}

          <div
            className="hs-notification-header"
          >

            <div>

              <strong>
                Notifications
              </strong>

              <span>
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'All caught up'}
              </span>

            </div>


            <div
              className="hs-notification-actions"
            >

              {unreadCount > 0 && (
                <button
                  type="button"

                  className="hs-notification-mark-all"

                  onClick={
                    markAllAsRead
                  }

                  disabled={
                    actionLoading
                  }

                  title="Mark all as read"

                  aria-label="Mark all notifications as read"
                >

                  <CheckCheck
                    size={16}
                  />

                </button>
              )}


              <button
                type="button"

                className="hs-notification-close"

                onClick={
                  closeNotifications
                }

                title="Close"

                aria-label="Close notifications"
              >

                <X size={16} />

              </button>

            </div>

          </div>


          <div
            className="hs-notification-divider"
          />


          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (
            <div
              className="hs-notification-empty"
            >
              Loading notifications...
            </div>
          )}


          {/* =================================================
              ERROR
          ================================================== */}

          {!loading &&
            error && (

              <div
                className="hs-notification-error"
              >

                <span>
                  {error}
                </span>

                <button
                  type="button"
                  onClick={
                    loadNotifications
                  }
                >
                  Retry
                </button>

              </div>
            )}


          {/* =================================================
              EMPTY
          ================================================== */}

          {!loading &&
            !error &&
            notifications.length === 0 && (

              <div
                className="hs-notification-empty"
              >

                <Bell size={22} />

                <strong>
                  No notifications
                </strong>

                <span>
                  You're all caught up.
                </span>

              </div>
            )}


          {/* =================================================
              LATEST NOTIFICATIONS
          ================================================== */}

          {!loading &&
            !error &&
            notifications.length > 0 && (

              <div
                className="hs-notification-list"
              >

                {notifications.map(
                  (notification) => (

                    <button
                      type="button"

                      key={
                        notification.id
                      }

                      className={`hs-notification-item ${
                        notification.is_read
                          ? ''
                          : 'is-unread'
                      }`}

                      onClick={() =>
                        handleNotificationClick(
                          notification
                        )
                      }

                      disabled={
                        actionLoading
                      }
                    >

                      <span
                        className="hs-notification-item-dot"
                      />


                      <span
                        className="hs-notification-content"
                      >

                        <strong>
                          {notification.title ||
                            'Notification'}
                        </strong>

                        <span>
                          {notification.message ||
                            ''}
                        </span>

                        {notification.created_at && (
                          <small>
                            {formatDate(
                              notification.created_at
                            )}
                          </small>
                        )}

                      </span>

                    </button>
                  )
                )}

              </div>
            )}


          {/* =================================================
              VIEW ALL
          ================================================== */}

          {!loading &&
            !error && (

              <>

                <div
                  className="hs-notification-divider"
                />

                <button
                  type="button"

                  className="hs-notification-view-all"

                  onClick={
                    openNotificationHistory
                  }

                  title="View notification history"
                >

                  <History
                    size={16}
                  />

                  <span>
                    View all notifications
                  </span>

                </button>

              </>
            )}

        </div>
      )}

    </div>
  )
}


export default NotificationBell