using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using Crawler.Engine;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Crawler.WebApi.Controllers
{
    [Route("api/[controller]")]
    public class CrawlerController : Controller
    {
        private IMemoryCache cache;
        private readonly Crawler.Engine.Options options;
        private readonly Crawler.Engine.TasksManager taskManager;

        public CrawlerController(IMemoryCache cache, IOptions<Engine.Options> optionsAccessor, Crawler.Engine.TasksManager taskManager)
        {
            this.cache = cache;
            this.options = optionsAccessor.Value;
            this.taskManager = taskManager;
        }

        [HttpGet("{url}")]
        [HttpGet("{words}")]
        [HttpGet("{depth:int}")]
        [Route("[action]")]
        public IDictionary<string, int> ExtractInfoFromWebsite(string url, string[] words, int depth)
        {
            Crawler.Engine.Crawler crawler = new Crawler.Engine.Crawler(this.cache, this.options, this.taskManager);
            return crawler.ExtractInfoFromWebsite(url, words, depth).Statistics;
        }
    }
}
