using System;
using System.Threading;

namespace DataAccess
{
    public class ReadersWriter
    {
        private static readonly ManualResetEvent resetEvent = new ManualResetEvent(false);
        private static readonly object LockSync = new object();
        private static readonly object LockWrite = new object();
        private static readonly object LockRead = new object();
        private int readersCount = 0;

        public T Read<T>(Func<T> readFunction)
        {
            bool lockTaken = false;
            /*
                There might be cases in which multiple reads are triggered
                than a single write followed by more of multilpe reads
                In this case, the write method will lock the sync object
                and will cause it to be executed before the other multi reads
             */
            Monitor.Enter(ReadersWriter.LockSync);
            Monitor.Exit(ReadersWriter.LockSync);

            // Make the access to the readers counter atomic
            Monitor.Enter(ReadersWriter.LockRead);
            if (this.readersCount == 0)
            {
                /*
                    Ensure locking the write operation in case this is the first read
                    We lock it only for the first time in order to prevent other reads 
                    waiting for this lock to be released.
                 */
                Monitor.Enter(ReadersWriter.LockWrite, ref lockTaken);
            }
            // Increase the readers counter
            this.readersCount += 1;
            Monitor.Exit(ReadersWriter.LockRead);

            T result;
            try
            {
                result = readFunction();
            }
            finally
            {
                Monitor.Enter(ReadersWriter.LockRead);
                // Reduce readers counter
                this.readersCount -= 1;
                if (this.readersCount == 0)
                {
                    /*
                        In case there are no more readers executing right now
                        Release the lock for writing
                     */
                    // if (!lockTaken)
                    {
                        //     resetEvent.Reset();
                        //     resetEvent.WaitOne();
                        //     Monitor.Exit(ReadersWriter.LockWrite);
                        // }
                        // else
                        // {
                        resetEvent.Set();
                    }
                }
                Monitor.Exit(ReadersWriter.LockRead);
            }
            // This is kinda workaround
            // Only thie first thread that acquired the lock
            // will release it
            if (lockTaken)
            {
                resetEvent.WaitOne();
                Monitor.Exit(ReadersWriter.LockWrite);
            }
            return result;
        }

        public void Write(Action writeAction)
        {
            // Lock for sync
            Monitor.Enter(ReadersWriter.LockSync);
            /*
                Lock for write
                This will actually cause no other Write or Read 
                operation to be executed until this write is done
             */
            Monitor.Enter(ReadersWriter.LockWrite);

            writeAction();

            // Release the lock for write operations
            Monitor.Exit(ReadersWriter.LockWrite);
            // Release Sync lock¸
            Monitor.Exit(ReadersWriter.LockSync);
        }
    }
}