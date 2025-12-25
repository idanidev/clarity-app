import { LocalNotifications, ScheduleOptions, PendingLocalNotificationSchema } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export interface BudgetNotification {
    categoryName: string;
    budgetAmount: number;
    currentSpent: number;
    percentUsed: number;
}

/**
 * Servicio de notificaciones locales para Clarity
 * Maneja alertas de presupuesto y recordatorios
 */
class NotificationService {
    private initialized = false;

    /**
     * Inicializa el servicio de notificaciones
     * Solicita permisos si es necesario
     */
    async initialize(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return false;
        if (this.initialized) return true;

        try {
            // Verificar permisos
            const permission = await LocalNotifications.checkPermissions();

            if (permission.display === 'prompt') {
                const result = await LocalNotifications.requestPermissions();
                if (result.display !== 'granted') {
                    console.warn('Notification permissions denied');
                    return false;
                }
            } else if (permission.display !== 'granted') {
                return false;
            }

            this.initialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing notifications:', error);
            return false;
        }
    }

    /**
     * Envía una notificación de advertencia de presupuesto
     */
    async sendBudgetWarning(notification: BudgetNotification): Promise<void> {
        if (!await this.initialize()) return;

        const { categoryName, budgetAmount, currentSpent, percentUsed } = notification;

        let title: string;
        let body: string;

        if (percentUsed >= 100) {
            title = `⚠️ Presupuesto excedido: ${categoryName}`;
            body = `Has gastado €${currentSpent.toFixed(2)} de los €${budgetAmount.toFixed(2)} presupuestados.`;
        } else if (percentUsed >= 90) {
            title = `🔔 ${categoryName}: 90% del presupuesto`;
            body = `Te quedan €${(budgetAmount - currentSpent).toFixed(2)} en esta categoría.`;
        } else if (percentUsed >= 75) {
            title = `📊 ${categoryName}: 75% del presupuesto`;
            body = `Has usado €${currentSpent.toFixed(2)} de €${budgetAmount.toFixed(2)}.`;
        } else {
            return; // No notificar si está por debajo del 75%
        }

        await this.scheduleNotification({
            id: this.generateId(categoryName),
            title,
            body,
            schedule: { at: new Date() },
            sound: 'default',
            actionTypeId: 'BUDGET_WARNING',
            extra: {
                type: 'budget_warning',
                category: categoryName,
                percentUsed,
            },
        });
    }

    /**
     * Programa un recordatorio de gasto recurrente
     */
    async scheduleRecurringExpenseReminder(
        expenseName: string,
        amount: number,
        dayOfMonth: number
    ): Promise<void> {
        if (!await this.initialize()) return;

        // Programar para el día anterior al cobro
        const reminderDay = dayOfMonth === 1 ? 28 : dayOfMonth - 1;
        const now = new Date();
        const scheduleDate = new Date(now.getFullYear(), now.getMonth(), reminderDay, 10, 0);

        // Si la fecha ya pasó este mes, programar para el próximo
        if (scheduleDate < now) {
            scheduleDate.setMonth(scheduleDate.getMonth() + 1);
        }

        await this.scheduleNotification({
            id: this.generateId(`recurring_${expenseName}`),
            title: '📅 Recordatorio de gasto',
            body: `Mañana se cargará ${expenseName}: €${amount.toFixed(2)}`,
            schedule: { at: scheduleDate, repeats: true },
            sound: 'default',
            extra: {
                type: 'recurring_reminder',
                expenseName,
                amount,
            },
        });
    }

    /**
     * Programa una notificación
     */
    private async scheduleNotification(options: ScheduleOptions['notifications'][0]): Promise<void> {
        try {
            await LocalNotifications.schedule({
                notifications: [options],
            });
        } catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }

    /**
     * Cancela todas las notificaciones pendientes
     */
    async cancelAll(): Promise<void> {
        if (!Capacitor.isNativePlatform()) return;

        try {
            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel({
                    notifications: pending.notifications.map((n: PendingLocalNotificationSchema) => ({ id: n.id })),
                });
            }
        } catch (error) {
            console.error('Error canceling notifications:', error);
        }
    }

    /**
     * Genera un ID único basado en string
     */
    private generateId(key: string): number {
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();

// Hook para usar notificaciones en componentes React
import { useCallback } from 'react';

export const useNotificationService = () => {
    const sendBudgetWarning = useCallback(async (notification: BudgetNotification) => {
        await notificationService.sendBudgetWarning(notification);
    }, []);

    const scheduleRecurringReminder = useCallback(async (
        expenseName: string,
        amount: number,
        dayOfMonth: number
    ) => {
        await notificationService.scheduleRecurringExpenseReminder(expenseName, amount, dayOfMonth);
    }, []);

    const cancelAllNotifications = useCallback(async () => {
        await notificationService.cancelAll();
    }, []);

    return {
        sendBudgetWarning,
        scheduleRecurringReminder,
        cancelAllNotifications,
    };
};
