// セキュリティイベントの監視と異常検知システム

interface SecurityEvent {
  type:
    | "login_attempt"
    | "failed_login"
    | "csrf_violation"
    | "rate_limit_exceeded"
    | "file_upload_blocked"
    | "suspicious_activity";
  userId?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  details: Record<string, unknown>;
  severity: "low" | "medium" | "high" | "critical";
}

interface SecurityAlert {
  alertId: string;
  events: SecurityEvent[];
  detectionTime: string;
  alertType:
    | "multiple_failed_logins"
    | "csrf_attack"
    | "suspicious_file_upload"
    | "rate_limit_abuse";
  severity: "medium" | "high" | "critical";
  description: string;
}

// メモリベースの簡易セキュリティイベント監視
class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private readonly MAX_EVENTS = 1000; // メモリ使用量制限
  private readonly DETECTION_WINDOW = 15 * 60 * 1000; // 15分

  // 閾値設定
  private readonly THRESHOLDS = {
    FAILED_LOGINS_PER_IP: 5,
    FAILED_LOGINS_PER_USER: 3,
    CSRF_VIOLATIONS_PER_IP: 3,
    FILE_UPLOAD_BLOCKS_PER_IP: 10,
    RATE_LIMIT_HITS_PER_IP: 20,
  };

  /**
   * セキュリティイベントを記録し、異常を検知する
   */
  recordEvent(event: SecurityEvent): SecurityAlert[] {
    // イベントを記録
    this.events.push(event);

    // 古いイベントを削除（メモリ使用量制限）
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // 異常検知実行
    const alerts = this.detectAnomalies(event);

    // アラートがある場合はログ出力
    if (alerts.length > 0) {
      alerts.forEach((alert) => {
        console.warn(
          `[SECURITY ALERT] ${alert.alertType}: ${alert.description}`,
          {
            alertId: alert.alertId,
            severity: alert.severity,
            events: alert.events.length,
            detectionTime: alert.detectionTime,
            details: alert.events.map((e) => ({
              type: e.type,
              userId: e.userId,
              ip: e.ip,
              timestamp: e.timestamp,
            })),
          }
        );
      });
    }

    return alerts;
  }

  /**
   * 異常検知ルール
   */
  private detectAnomalies(currentEvent: SecurityEvent): SecurityAlert[] {
    const alerts: SecurityAlert[] = [];
    const now = Date.now();
    const windowStart = new Date(now - this.DETECTION_WINDOW);

    // 検知ウィンドウ内のイベントを取得
    const recentEvents = this.events.filter(
      (event) => new Date(event.timestamp) >= windowStart
    );

    // 1. 複数の失敗ログイン検知（IP別）
    if (currentEvent.type === "failed_login" && currentEvent.ip) {
      const failedLoginsByIP = recentEvents.filter(
        (event) => event.type === "failed_login" && event.ip === currentEvent.ip
      );

      if (failedLoginsByIP.length >= this.THRESHOLDS.FAILED_LOGINS_PER_IP) {
        alerts.push({
          alertId: `failed_login_ip_${currentEvent.ip}_${now}`,
          events: failedLoginsByIP,
          detectionTime: new Date().toISOString(),
          alertType: "multiple_failed_logins",
          severity: "high",
          description: `IP ${currentEvent.ip} で ${failedLoginsByIP.length} 回の失敗ログインが検出されました`,
        });
      }
    }

    // 2. 複数の失敗ログイン検知（ユーザー別）
    if (currentEvent.type === "failed_login" && currentEvent.userId) {
      const failedLoginsByUser = recentEvents.filter(
        (event) =>
          event.type === "failed_login" && event.userId === currentEvent.userId
      );

      if (failedLoginsByUser.length >= this.THRESHOLDS.FAILED_LOGINS_PER_USER) {
        alerts.push({
          alertId: `failed_login_user_${currentEvent.userId}_${now}`,
          events: failedLoginsByUser,
          detectionTime: new Date().toISOString(),
          alertType: "multiple_failed_logins",
          severity: "medium",
          description: `ユーザー ${currentEvent.userId} で ${failedLoginsByUser.length} 回の失敗ログインが検出されました`,
        });
      }
    }

    // 3. CSRF攻撃検知
    if (currentEvent.type === "csrf_violation" && currentEvent.ip) {
      const csrfViolationsByIP = recentEvents.filter(
        (event) =>
          event.type === "csrf_violation" && event.ip === currentEvent.ip
      );

      if (csrfViolationsByIP.length >= this.THRESHOLDS.CSRF_VIOLATIONS_PER_IP) {
        alerts.push({
          alertId: `csrf_attack_${currentEvent.ip}_${now}`,
          events: csrfViolationsByIP,
          detectionTime: new Date().toISOString(),
          alertType: "csrf_attack",
          severity: "critical",
          description: `IP ${currentEvent.ip} からの CSRF 攻撃が検出されました (${csrfViolationsByIP.length} 回)`,
        });
      }
    }

    // 4. suspicious file upload 検知
    if (currentEvent.type === "file_upload_blocked" && currentEvent.ip) {
      const blockedUploadsByIP = recentEvents.filter(
        (event) =>
          event.type === "file_upload_blocked" && event.ip === currentEvent.ip
      );

      if (
        blockedUploadsByIP.length >= this.THRESHOLDS.FILE_UPLOAD_BLOCKS_PER_IP
      ) {
        alerts.push({
          alertId: `suspicious_upload_${currentEvent.ip}_${now}`,
          events: blockedUploadsByIP,
          detectionTime: new Date().toISOString(),
          alertType: "suspicious_file_upload",
          severity: "high",
          description: `IP ${currentEvent.ip} からの悪意のあるファイルアップロード試行が検出されました (${blockedUploadsByIP.length} 回)`,
        });
      }
    }

    // 5. レート制限乱用検知
    if (currentEvent.type === "rate_limit_exceeded" && currentEvent.ip) {
      const rateLimitsByIP = recentEvents.filter(
        (event) =>
          event.type === "rate_limit_exceeded" && event.ip === currentEvent.ip
      );

      if (rateLimitsByIP.length >= this.THRESHOLDS.RATE_LIMIT_HITS_PER_IP) {
        alerts.push({
          alertId: `rate_limit_abuse_${currentEvent.ip}_${now}`,
          events: rateLimitsByIP,
          detectionTime: new Date().toISOString(),
          alertType: "rate_limit_abuse",
          severity: "medium",
          description: `IP ${currentEvent.ip} からのレート制限乱用が検出されました (${rateLimitsByIP.length} 回)`,
        });
      }
    }

    return alerts;
  }

  /**
   * セキュリティ統計情報を取得
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    recentAlerts: number;
    topIPs: { ip: string; count: number }[];
  } {
    const now = Date.now();
    const windowStart = new Date(now - this.DETECTION_WINDOW);
    const recentEvents = this.events.filter(
      (event) => new Date(event.timestamp) >= windowStart
    );

    // イベントタイプ別集計
    const eventsByType: Record<string, number> = {};
    this.events.forEach((event) => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // IP別集計（上位10件）
    const ipCounts: Record<string, number> = {};
    recentEvents.forEach((event) => {
      if (event.ip) {
        ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
      }
    });

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    return {
      totalEvents: this.events.length,
      eventsByType,
      recentAlerts: 0, // 簡易実装では省略
      topIPs,
    };
  }
}

// シングルトンインスタンス
const securityMonitor = new SecurityMonitor();

/**
 * セキュリティイベントを記録する便利関数
 */
export function recordSecurityEvent(
  type: SecurityEvent["type"],
  details: Record<string, unknown>,
  severity: SecurityEvent["severity"] = "medium",
  userId?: string,
  ip?: string,
  userAgent?: string
): SecurityAlert[] {
  const event: SecurityEvent = {
    type,
    userId,
    ip,
    userAgent,
    timestamp: new Date().toISOString(),
    details,
    severity,
  };

  return securityMonitor.recordEvent(event);
}

/**
 * セキュリティ統計情報を取得する便利関数
 */
export function getSecurityStats() {
  return securityMonitor.getSecurityStats();
}

/**
 * 失敗ログインを記録
 */
export function recordFailedLogin(
  userId: string | undefined,
  ip: string,
  userAgent: string,
  reason: string
): SecurityAlert[] {
  return recordSecurityEvent(
    "failed_login",
    { reason, userAgent },
    "medium",
    userId,
    ip,
    userAgent
  );
}

/**
 * CSRF違反を記録
 */
export function recordCSRFViolation(
  ip: string,
  userAgent: string,
  details: Record<string, unknown>
): SecurityAlert[] {
  return recordSecurityEvent(
    "csrf_violation",
    { ...details, userAgent },
    "critical",
    undefined,
    ip,
    userAgent
  );
}

/**
 * ファイルアップロードブロックを記録
 */
export function recordFileUploadBlocked(
  userId: string,
  ip: string,
  userAgent: string,
  fileName: string,
  reason: string
): SecurityAlert[] {
  return recordSecurityEvent(
    "file_upload_blocked",
    { fileName, reason, userAgent },
    "high",
    userId,
    ip,
    userAgent
  );
}

/**
 * レート制限超過を記録
 */
export function recordRateLimitExceeded(
  ip: string,
  userAgent: string,
  endpoint: string
): SecurityAlert[] {
  return recordSecurityEvent(
    "rate_limit_exceeded",
    { endpoint, userAgent },
    "medium",
    undefined,
    ip,
    userAgent
  );
}
