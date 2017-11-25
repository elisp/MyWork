namespace Crawler.Engine
{
    public class Options
    {
        public Options()
        {
            this.MaxAvailableThreads = 3;
            this.UrlExpirationPeriod = 1;
        }
        public int MaxAvailableThreads { get; set; }
        public int UrlExpirationPeriod { get; set; }
    }
}
