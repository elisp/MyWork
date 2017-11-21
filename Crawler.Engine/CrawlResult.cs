using System.Collections.Generic;

namespace Crawler.Engine
{
    public class CrawlResult
    {
        private IDictionary<string, int> statistics;

        public bool Success { get; set; }

        public ISet<string> Links { get; set; }

        public CrawlResult()
        {
            this.Links = new HashSet<string>();
            this.Success = true;
        }

        public IDictionary<string, int> Statistics
        {
            get
            {
                if (this.statistics == null)
                    this.statistics = new Dictionary<string, int>();
                return this.statistics;
            }
        }
    }
}
