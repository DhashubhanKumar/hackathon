import { AIDecisionLog } from './types';

/**
 * AI Decision Logger
 * Logs all AI decisions for transparency and debugging
 */
class AILogger {
    private logs: AIDecisionLog[] = [];

    log(entry: Omit<AIDecisionLog, 'timestamp'>): void {
        const logEntry: AIDecisionLog = {
            ...entry,
            timestamp: new Date(),
        };

        this.logs.push(logEntry);

        // Console logging for development
        console.log('🤖 AI Decision:', {
            system: logEntry.system,
            model: logEntry.model,
            context: logEntry.context,
            promptLength: logEntry.prompt.length,
            responseLength: logEntry.response.length,
        });
    }

    getLogs(system?: string): AIDecisionLog[] {
        if (system) {
            return this.logs.filter(log => log.system === system);
        }
        return this.logs;
    }

    getRecentLogs(count: number = 10): AIDecisionLog[] {
        return this.logs.slice(-count);
    }

    clear(): void {
        this.logs = [];
    }
}

export const aiLogger = new AILogger();
