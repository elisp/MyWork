using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Microsoft.Extensions.Caching.Memory;

namespace Crawler.Engine
{
    public class Crawler
    {
        private static readonly object COUNTER_LOCK = new object();
        private static readonly object COPY_LOCK = new object();
        private static readonly object LOCK = new object();
        private readonly IMemoryCache cache;
        private readonly Options options;
        private readonly TasksManager tasksManager;
        private int threadCount = 0;

        public Crawler(IMemoryCache cache, Options options, TasksManager taskManager)
        {
            this.cache = cache;
            this.options = options;
            this.tasksManager = taskManager;
        }
        private ISet<string> GetLinks(string content)
        {
            Regex regexLinkPattern = new Regex("(?<=<a\\s*?href=(?:'|\"))[^'\"]*?(?=(?:'|\"))");

            ISet<string> newLinks = new HashSet<string>();
            foreach (var match in regexLinkPattern.Matches(content))
            {
                if (!newLinks.Contains(match.ToString()))
                    newLinks.Add(match.ToString());
            }

            return newLinks;
        }

        private int GetNumberOfOccorences(string content, string word)
        {
            return Regex.Matches(content, @"\b" + word + @"\b").Count;
        }

        private string GetContent(string url)
        {
            string data = null;
            try
            {
                using (WebClient client = new WebClient())
                {
                    data = client.DownloadString(url);
                }
            }
            catch { }
            return data;
        }

        private void IncreaseCounter()
        {
            lock (Crawler.COUNTER_LOCK)
            {
                this.threadCount += 1;
                Console.WriteLine("Counter = {0}", this.threadCount);
            }
        }

        private void DecreaseCounter()
        {
            lock (Crawler.COUNTER_LOCK)
            {
                this.threadCount -= 1;
                Console.WriteLine("Counter = {0}", this.threadCount);
            }
        }

        private void ProcessPage(string url, string[] words, int depth, CrawlResult aggrigate, bool ignoreIncreaseCounter = false)
        {
            if (!ignoreIncreaseCounter)
                this.IncreaseCounter();
            if (Uri.IsWellFormedUriString(url, UriKind.Absolute))
            {
                CrawlResult processedPage;
                if (!this.cache.TryGetValue(url, out processedPage))
                {
                    lock (Crawler.LOCK)
                    {
                        if (!this.cache.TryGetValue(url, out processedPage))
                        {
                            processedPage = new CrawlResult();
                            string content = this.GetContent(url);
                            if (!string.IsNullOrWhiteSpace(content))
                            {
                                foreach (string word in words)
                                {
                                    processedPage.Statistics[word] = this.GetNumberOfOccorences(content, word);
                                }
                                processedPage.Links = this.GetLinks(content);
                            }
                            this.cache.CreateEntry(url)
                            .SetValue(processedPage)
                            .SetSlidingExpiration(TimeSpan.FromMinutes(this.options.UrlExpirationPeriod));
                        }
                    }
                    if (depth > 1)
                    {
                        foreach (string link in processedPage.Links)
                        {
                            this.tasksManager.AddWork(() =>
                            {
                                this.ProcessPage(link, words, depth - 1, aggrigate);
                            });
                        }
                    }
                }
                this.CopyStatistics(processedPage, aggrigate);
                // return aggrigate;
            }
            this.DecreaseCounter();
        }

        private void CopyStatistics(CrawlResult source, CrawlResult target)
        {
            lock (Crawler.COPY_LOCK)
            {
                int value;
                foreach (string word in source.Statistics.Keys)
                {
                    value = 0;
                    target.Statistics.TryGetValue(word, out value);
                    value += source.Statistics[word];
                    target.Statistics[word] = value;
                }
            }
        }

        public CrawlResult ExtractInfoFromWebsite(string url, string[] words, int depth)
        {
            CrawlResult result = new CrawlResult();
            this.IncreaseCounter();
            this.tasksManager.AddWork(() =>
            {
                ProcessPage(url, words, depth, result, true);
            });
            do
            {
                SpinWait.SpinUntil(() => Volatile.Read(ref this.threadCount) == 0);
            }
            while (Volatile.Read(ref this.threadCount) > 0);
            return result;
        }
    }
}
