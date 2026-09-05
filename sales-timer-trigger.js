const {BlobServiceClient}=require("@azure/storage-blob");
const parquet=require("parquetjs-lite");
module.exports=async function (context, myTimer) {
    try {
        const connectionString="";
        const blobServiceClient=BlobServiceClient.fromConnectionString(connectionString); //connecting to azure storage
        const containerClient=blobServiceClient.getContainerClient("sales-container"); //selecting container

        async function readParquet(fileName) {
            const blobClient=containerClient.getBlobClient("final_output/"+fileName); //choosing the correct parquet
            const data=await blobClient.downloadToBuffer();
            const reader=await parquet.ParquetReader.openBuffer(data);
            const cursor=reader.getCursor(); //helps to go through row by row
            const rows=[]
            let row
            while (row=await cursor.next()) {
                rows.push(row); //reading all the rows and adding it
            }
            await reader.close();
            return rows;
        }


        const aov=await readParquet("aov.parquet");
        const basket=await readParquet("basket_size.parquet");
        const cancellation=await readParquet("cancel2.parquet");
        const regions=await readParquet("sales_per_region.parquet");
        const topSellers=await readParquet("top_sellers.parquet");

        const topRegion=regions[0];


        context.log("the daily report is ");
        context.log("aov is "+aov[0].aov);
        context.log("no of items oer order is "+basket[0]["avg no of items per order"]);
        context.log("rate of cancellation "+cancellation[0].cancellation_rate);
        context.log("the top region is  " + topRegion.ship_state);
        context.log("the sales of the top region is " + topRegion.total);
        context.log("top selling products are", topSellers);
    } catch(error) {
        context.log(error);

    }
};