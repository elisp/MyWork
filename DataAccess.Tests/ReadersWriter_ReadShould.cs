using Xunit;
using DataAccess;
using System.Threading.Tasks;

namespace DataAccess.UnitTests.Services
{
    public class ReadersWriter_ReadShould
    {
        private readonly ReadersWriter readersWriter;

        public ReadersWriter_ReadShould()
        {
            readersWriter = new ReadersWriter();
        }

        [Fact]
        public void ReturnTrueForSingleWrite()
        {
            var result = readersWriter.Read<bool>(() =>
            {
                return true;
            });

            Assert.True(result, "Read should return true");
        }

        [Fact]
        public void ReturnTrueForTwoThreads()
        {
            bool[] result = new bool[2] { false, false };

            Task task1 = Task.Factory.StartNew(() =>
            {
                result[0] = readersWriter.Read<bool>(()=>{
                    return true;
                });
            });

            Task task2 = Task.Factory.StartNew(() =>
            {
                result[2] = readersWriter.Read<bool>(()=>{
                    return true;
                });
            });
            Task.WaitAll(task1, task2);
            
            Assert.True(result[0], "Read should return true");
            Assert.True(result[1], "Read should return true");
        }
    }
}