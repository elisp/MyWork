using Xunit;
using DataAccess;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

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
        public void ReturnTrueForSingleRead()
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
            Task<bool> task1 = new Task<bool>(() =>
            {
                return readersWriter.Read<bool>(() =>
                {
                    return true;
                });
            });

            Task<bool> task2 = new Task<bool>(() =>
            {
                return readersWriter.Read<bool>(() =>
                {
                    return false;
                });
            });
            
            task1.Start();
            task2.Start();
            Task.WaitAll(task1, task2);

            Assert.True(task1.Result, "Task1 should return true");
            Assert.False(task2.Result, "Task2 should return false");
        }
    }
}