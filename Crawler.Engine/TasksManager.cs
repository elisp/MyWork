using System;
using System.Collections.Concurrent;
using System.Threading;
using System.Threading.Tasks;

namespace Crawler.Engine
{
    public class TasksManager
    {
        private readonly ConcurrentQueue<Action> queue = new ConcurrentQueue<Action>();
        private Options options;

        private bool doneEnqueueing = false;

        public TasksManager(Options options)
        {
            this.options = options;
            this.run();
        }

        private async void run()
        {
            int threadCount = this.options.MaxAvailableThreads;
            Task[] workers = new Task[threadCount];

            for (int i = 0; i < threadCount; ++i)
            {
                int workerId = i;
                workers[i] = Task.Factory.StartNew(() => worker(workerId));
            }

            await Task.WhenAll(workers);
            Console.WriteLine("Done.");
        }

        public void AddWork(Action work)
        {
            this.queue.Enqueue(work);
            Console.WriteLine("Queue size is {0}", this.queue.Count);
        }

        private void worker(int workerId)
        {
            Console.WriteLine("Worker {0} is starting.", workerId);
            Action action;
            do
            {
                while (queue.TryDequeue(out action))
                {
                    Console.WriteLine("Worker {0} is processing an action", workerId);
                    Console.WriteLine("Queue size is {0}", this.queue.Count);
                    try
                    {
                        action();
                    }
                    catch (Exception ex)
                    {
                        Console.Write(ex);
                    }
                }
                SpinWait.SpinUntil(() => !Volatile.Read(ref doneEnqueueing) || (queue.Count > 0));

            } while (!Volatile.Read(ref doneEnqueueing) || (queue.Count > 0));
        }
    }
}
