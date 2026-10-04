import {
  Bell,
  CheckCheck,
  ArrowLeft,
  ExternalLink,
  BriefcaseBusiness,
  FileText,
  UserRound,
  Building2,
  Clock3,
} from 'lucide-react'

import {
  Navigate,
  useNavigate,
} from 'react-router-dom'

import { useEffect, useState } from 'react'

import AppShell from '../components/layout/AppShell'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'


function NotificationsPage() {
  const navigate = useNavigate()

  const {
    user,
    loading: authLoading,
    isAuthenticated,
  } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')


  // =========================================================
  // ROLE
  // =========================================================

  const role =
    user?.role === 'placement_officer'
      ? 'placement_officer'
      : user?.role === 'recruiter'
        ? 'recruiter'
        : 'candidate'


  // =========================================================
  // USER NAME
  // =========================================================

  const userName =
    user?.name ||
    user?.full_name ||
    'User'


  // =========================================================
  // LOAD ALL NOTIFICATIONS
  // =========================================================

  async function loadNotifications() {
    try {
      setLoading(true)
      setError('')

      const response = await api.get(
        '/notifications?limit=100'
      )

      const data = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.notifications)
          ? response.data.notifications
          : []

      setNotifications(data)

    } catch (err) {
      console.error(
        'Failed to load notifications:',
        err
      )

      setError(
        err.response?.data?.detail ||
        'Unable to load notifications.'
      )

    } finally {
      setLoading(false)
    }
  }


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (
      authLoading ||
      !isAuthenticated
    ) {
      return
    }

    loadNotifications()
  }, [
    authLoading,
    isAuthenticated,
  ])


  // =========================================================
  // MARK ONE AS READ
  // =========================================================

  async function markAsRead(notification) {
    if (
      !notification ||
      notification.is_read
    ) {
      return
    }

    try {
      setActionLoading(true)

      await api.patch(
        `/notifications/${notification.id}/read`
      )

      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                is_read: true,
              }
            : item
        )
      )

    } catch (err) {
      console.error(
        'Failed to mark notification as read:',
        err
      )
    } finally {
      setActionLoading(false)
    }
  }


  // =========================================================
  // MARK ALL AS READ
  // =========================================================

  async function markAllAsRead() {
    const unreadExists = notifications.some(
      (notification) =>
        !notification.is_read
    )

    if (!unreadExists) {
      return
    }

    try {
      setActionLoading(true)

      await api.patch(
        '/notifications/read-all'
      )

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          is_read: true,
        }))
      )

    } catch (err) {
      console.error(
        'Failed to mark all notifications as read:',
        err
      )
    } finally {
      setActionLoading(false)
    }
  }


  // =========================================================
  // NOTIFICATION DESTINATION
  // =========================================================

  function getNotificationDestination(
    notification
  ) {
    if (!notification) {
      return null
    }

    // If backend eventually provides an explicit link,
    // always prefer it.
    if (notification.link) {
      return notification.link
    }

    const type =
      notification.notification_type || ''


    // -------------------------------------------------------
    // CANDIDATE
    // -------------------------------------------------------

    if (
      type === 'application_submitted' ||
      type === 'application_status'
    ) {
      return '/candidate/applications'
    }


    if (
      type === 'new_job' ||
      type === 'job_updated'
    ) {
      return '/candidate/jobs'
    }


    // -------------------------------------------------------
    // RECRUITER
    // -------------------------------------------------------

    if (
      type === 'new_application'
    ) {
      return '/recruiter/applications'
    }


    // -------------------------------------------------------
    // DEFAULT
    // -------------------------------------------------------

    if (role === 'recruiter') {
      return '/recruiter'
    }

    if (role === 'placement_officer') {
      return '/placement-officer'
    }

    return '/candidate'
  }


  // =========================================================
  // HANDLE NOTIFICATION CLICK
  // =========================================================

  async function handleNotificationClick(
    notification
  ) {
    if (!notification) {
      return
    }

    await markAsRead(notification)

    const destination =
      getNotificationDestination(
        notification
      )

    if (destination) {
      navigate(destination)
    }
  }


  // =========================================================
  // DATE FORMAT
  // =========================================================

  function formatDate(value) {
    if (!value) {
      return ''
    }

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toLocaleString(
      'en-IN',
      {
        timeZone: 'Asia/Kolkata',
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
  // RELATIVE ICON
  // =========================================================

  function getNotificationIcon(
    notification
  ) {
    const type =
      notification?.notification_type ||
      ''

    if (
      type === 'new_job' ||
      type === 'job_updated'
    ) {
      return (
        <BriefcaseBusiness size={20} />
      )
    }

    if (
      type === 'application_submitted' ||
      type === 'application_status'
    ) {
      return (
        <FileText size={20} />
      )
    }

    if (
      type === 'new_application'
    ) {
      return (
        <UserRound size={20} />
      )
    }

    if (
      type === 'company'
    ) {
      return (
        <Building2 size={20} />
      )
    }

    return (
      <Bell size={20} />
    )
  }


  // =========================================================
  // AUTH LOADING
  // =========================================================

  if (authLoading) {
    return (
      <AppShell
        role={role}
        userName={userName}
      >
        <div className="hs-loading-page">
          <div className="hs-spinner" />
          <span>
            Loading notifications...
          </span>
        </div>
      </AppShell>
    )
  }


  // =========================================================
  // AUTH CHECK
  // =========================================================

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }


  // =========================================================
  // COUNTS
  // =========================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.is_read
    ).length


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <AppShell
      role={role}
      userName={userName}
    >

      <div
        style={{
          maxWidth: '1050px',
          margin: '0 auto',
          padding: '8px 0 50px',
        }}
      >

        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            marginBottom: '28px',
          }}
        >

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >

            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                border: '1px solid #e7e4ef',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#5f59d9',
              }}
              title="Go back"
            >
              <ArrowLeft size={19} />
            </button>

            <div>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#6c63df',
                  marginBottom: '6px',
                }}
              >
                Activity Center
              </div>

              <h1
                style={{
                  margin: 0,
                  fontSize: '32px',
                  lineHeight: 1.15,
                  color: '#252238',
                  fontWeight: 800,
                }}
              >
                Notifications
              </h1>

              <p
                style={{
                  margin:
                    '7px 0 0',
                  color: '#777387',
                  fontSize: '15px',
                }}
              >
                Your complete notification history
                and recent activity.
              </p>
            </div>

          </div>


          {/* MARK ALL */}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={actionLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #ddd9ef',
                background: '#ffffff',
                color: '#5d56d8',
                borderRadius: '12px',
                padding:
                  '10px 14px',
                fontWeight: 700,
                cursor:
                  actionLoading
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              <CheckCheck
                size={17}
              />
              Mark all as read
            </button>
          )}

        </div>


        {/* =================================================
            SUMMARY
        ================================================= */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(2, minmax(0, 1fr))',
            gap: '16px',
            marginBottom: '22px',
          }}
        >

          <div
            style={{
              background: '#ffffff',
              border:
                '1px solid #e9e6f0',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                color: '#777387',
                fontSize: '13px',
                marginBottom: '6px',
              }}
            >
              Total notifications
            </div>

            <strong
              style={{
                fontSize: '28px',
                color: '#252238',
              }}
            >
              {notifications.length}
            </strong>
          </div>


          <div
            style={{
              background:
                unreadCount > 0
                  ? '#f5f2ff'
                  : '#ffffff',
              border:
                '1px solid #e9e6f0',
              borderRadius: '16px',
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                color: '#777387',
                fontSize: '13px',
                marginBottom: '6px',
              }}
            >
              Unread
            </div>

            <strong
              style={{
                fontSize: '28px',
                color: '#5d56d8',
              }}
            >
              {unreadCount}
            </strong>
          </div>

        </div>


        {/* =================================================
            MAIN CARD
        ================================================= */}

        <div
          style={{
            background: '#ffffff',
            border:
              '1px solid #e7e4ee',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow:
              '0 10px 30px rgba(42, 35, 75, 0.05)',
          }}
        >

          {/* HEADER */}

          <div
            style={{
              padding:
                '20px 24px',
              borderBottom:
                '1px solid #eeeaf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent:
                'space-between',
            }}
          >

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Bell
                size={19}
                color="#6259dc"
              />

              <strong
                style={{
                  fontSize: '16px',
                  color: '#29253b',
                }}
              >
                All notifications
              </strong>
            </div>

            <span
              style={{
                color: '#888397',
                fontSize: '13px',
              }}
            >
              Sorted by newest
            </span>

          </div>


          {/* LOADING */}

          {loading && (
            <div
              style={{
                padding: '70px 20px',
                textAlign: 'center',
                color: '#777387',
              }}
            >
              <div
                className="hs-spinner"
                style={{
                  margin:
                    '0 auto 16px',
                }}
              />

              Loading your notifications...
            </div>
          )}


          {/* ERROR */}

          {!loading && error && (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <strong
                style={{
                  display: 'block',
                  color: '#302c3e',
                  marginBottom: '8px',
                }}
              >
                Unable to load notifications
              </strong>

              <p
                style={{
                  color: '#777387',
                  marginBottom: '20px',
                }}
              >
                {error}
              </p>

              <button
                type="button"
                onClick={loadNotifications}
                className="hs-primary-action"
              >
                Try again
              </button>
            </div>
          )}


          {/* EMPTY */}

          {!loading &&
            !error &&
            notifications.length === 0 && (
              <div
                style={{
                  padding: '80px 20px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    margin:
                      '0 auto 16px',
                    borderRadius: '16px',
                    background: '#f1efff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent:
                      'center',
                    color: '#6259dc',
                  }}
                >
                  <Bell size={25} />
                </div>

                <strong
                  style={{
                    display: 'block',
                    fontSize: '17px',
                    color: '#302c3e',
                    marginBottom: '6px',
                  }}
                >
                  No notifications yet
                </strong>

                <span
                  style={{
                    color: '#888397',
                    fontSize: '14px',
                  }}
                >
                  You're all caught up.
                </span>
              </div>
            )}


          {/* NOTIFICATIONS */}

          {!loading &&
            !error &&
            notifications.length > 0 && (
              <div>

                {notifications.map(
                  (notification, index) => {

                    const destination =
                      getNotificationDestination(
                        notification
                      )

                    return (
                      <button
                        type="button"
                        key={
                          notification.id
                        }
                        onClick={() =>
                          handleNotificationClick(
                            notification
                          )
                        }
                        disabled={
                          actionLoading
                        }
                        style={{
                          width: '100%',
                          border: 'none',
                          borderBottom:
                            index <
                            notifications.length -
                              1
                              ? '1px solid #efedf3'
                              : 'none',
                          background:
                            notification.is_read
                              ? '#ffffff'
                              : '#faf8ff',
                          padding:
                            '20px 24px',
                          display: 'flex',
                          alignItems:
                            'flex-start',
                          gap: '16px',
                          textAlign: 'left',
                          cursor:
                            actionLoading
                              ? 'not-allowed'
                              : 'pointer',
                          transition:
                            'background 0.15s ease',
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background =
                            '#f7f5ff'
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background =
                            notification.is_read
                              ? '#ffffff'
                              : '#faf8ff'
                        }}
                      >

                        {/* ICON */}

                        <div
                          style={{
                            flex:
                              '0 0 auto',
                            width: '46px',
                            height: '46px',
                            borderRadius:
                              '14px',
                            background:
                              notification.is_read
                                ? '#f0eef8'
                                : '#e9e5ff',
                            color:
                              '#6259dc',
                            display: 'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center',
                          }}
                        >
                          {getNotificationIcon(
                            notification
                          )}
                        </div>


                        {/* CONTENT */}

                        <div
                          style={{
                            minWidth: 0,
                            flex: 1,
                          }}
                        >

                          <div
                            style={{
                              display: 'flex',
                              alignItems:
                                'center',
                              gap: '9px',
                              marginBottom:
                                '6px',
                            }}
                          >

                            {!notification.is_read && (
                              <span
                                style={{
                                  width: '7px',
                                  height: '7px',
                                  borderRadius:
                                    '50%',
                                  background:
                                    '#6259dc',
                                  flex:
                                    '0 0 auto',
                                }}
                              />
                            )}

                            <strong
                              style={{
                                fontSize: '15px',
                                color:
                                  '#29253b',
                              }}
                            >
                              {notification.title ||
                                'Notification'}
                            </strong>

                          </div>


                          <p
                            style={{
                              margin:
                                '0 0 9px',
                              color:
                                '#6f6a7b',
                              fontSize: '14px',
                              lineHeight:
                                1.55,
                            }}
                          >
                            {notification.message ||
                              ''}
                          </p>


                          <div
                            style={{
                              display: 'flex',
                              alignItems:
                                'center',
                              gap: '7px',
                              color:
                                '#9490a0',
                              fontSize: '12px',
                            }}
                          >
                            <Clock3
                              size={14}
                            />

                            <span>
                              {formatDate(
                                notification.created_at
                              )}
                            </span>
                          </div>

                        </div>


                        {/* DESTINATION */}

                        {destination && (
                          <ExternalLink
                            size={17}
                            color="#aaa5b6"
                            style={{
                              flex:
                                '0 0 auto',
                              marginTop:
                                '5px',
                            }}
                          />
                        )}

                      </button>
                    )
                  }
                )}

              </div>
            )}

        </div>

      </div>

    </AppShell>
  )
}

export default NotificationsPage