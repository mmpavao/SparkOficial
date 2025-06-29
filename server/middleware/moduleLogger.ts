
import fs from 'fs';
import path from 'path';

interface ProtectionLog {
  timestamp: string;
  userRole: string;
  attemptedAction: string;
  targetModule: string;
  blocked: boolean;
  reason: string;
}

class ModuleProtectionLogger {
  private logFile = path.join(process.cwd(), 'module-protection.log');
  
  log(entry: ProtectionLog) {
    const logEntry = `${entry.timestamp} | ${entry.userRole} | ${entry.attemptedAction} | ${entry.targetModule} | ${entry.blocked ? 'BLOCKED' : 'ALLOWED'} | ${entry.reason}\n`;
    
    fs.appendFileSync(this.logFile, logEntry);
    
    if (entry.blocked) {
      console.warn(`🚫 PROTEÇÃO MODULAR: ${entry.reason}`);
    }
  }
  
  getViolations(): ProtectionLog[] {
    if (!fs.existsSync(this.logFile)) return [];
    
    const content = fs.readFileSync(this.logFile, 'utf-8');
    return content.split('\n')
      .filter(line => line.includes('BLOCKED'))
      .map(line => {
        const parts = line.split(' | ');
        return {
          timestamp: parts[0],
          userRole: parts[1],
          attemptedAction: parts[2],
          targetModule: parts[3],
          blocked: parts[4] === 'BLOCKED',
          reason: parts[5]
        };
      });
  }
}

export const protectionLogger = new ModuleProtectionLogger();
