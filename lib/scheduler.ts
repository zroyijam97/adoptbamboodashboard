// Sistem scheduler untuk auto-polling pembayaran

class PaymentScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private intervalMinutes = 5; // Default: setiap 5 minit

  constructor(intervalMinutes: number = 5) {
    this.intervalMinutes = intervalMinutes;
  }

  // Mulakan auto-polling
  start() {
    if (this.isRunning) {
      console.log('Payment scheduler already running');
      return;
    }

    console.log(`Starting payment scheduler - will run every ${this.intervalMinutes} minutes`);
    
    // Jalankan sekali sekarang
    this.runAutoPoll();
    
    // Setup interval untuk menjalankan secara berkala
    this.intervalId = setInterval(() => {
      this.runAutoPoll();
    }, this.intervalMinutes * 60 * 1000); // Convert minit ke milliseconds

    this.isRunning = true;
  }

  // Hentikan auto-polling
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Payment scheduler stopped');
  }

  // Tukar interval
  setInterval(minutes: number) {
    this.intervalMinutes = minutes;
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  // Dapatkan status scheduler
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalMinutes: this.intervalMinutes,
      nextRun: this.isRunning ? new Date(Date.now() + this.intervalMinutes * 60 * 1000) : null
    };
  }

  // Jalankan auto-polling
  private async runAutoPoll() {
    try {
      console.log('Running scheduled auto-poll...', new Date().toISOString());
      
      // Panggil API auto-poll
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/payment/auto-poll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Auto-poll completed successfully:', {
          processed: result.processedCount,
          alreadyProcessed: result.alreadyProcessedCount,
          errors: result.errorCount
        });
      } else {
        console.error('Auto-poll failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error running auto-poll:', error);
    }
  }
}

// Export singleton instance
export const paymentScheduler = new PaymentScheduler(5); // Default 5 minit

// Auto-start scheduler jika dalam production atau development
if (typeof window === 'undefined') { // Server-side only
  // Tunggu 30 saat selepas server start sebelum mulakan scheduler
  setTimeout(() => {
    paymentScheduler.start();
  }, 30000);
}