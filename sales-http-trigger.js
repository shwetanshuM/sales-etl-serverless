const { BlobServiceClient }=require("@azure/storage-blob");
const parquet=require("parquetjs-lite");

module.exports=async function (context, req) {

    try {
        const connectionString ="";
        const blobServiceClient=BlobServiceClient.fromConnectionString(connectionString); //connecting to azurestorage
        const containerClient= blobServiceClient.getContainerClient("sales-container");  //selecting container

        async function readParquet(fileName) {
            const blobClient =containerClient.getBlobClient("final_output/" + fileName); //choosing the correct parquet
            const data=await blobClient.downloadToBuffer();
            const reader=await parquet.ParquetReader.openBuffer(data);
            const cursor=reader.getCursor(); //helps  go through row by row
            const rows =[]
            let row
            while (row=await cursor.next()) {
                rows.push(row); //reading all the rows and adding it
            }
            await reader.close();
            return rows;
        }

        //reading the outputs
        const aov=await readParquet("aov.parquet");
        const basket=await readParquet("basket_size.parquet");
        const cancellation=await readParquet("cancel2.parquet");
        const regions=await readParquet("sales_per_region.parquet");
        const topSellers=await readParquet("top_sellers.parquet");

        const topRegion=regions[0];

        context.res = {
            status:200,

            headers: {
                "Content-Type": "application/json" //the type jere is json
            },

            body:{
                average_order_value:aov[0].aov,

                basket_size:basket[0]["avg no of items per order"],
                cancellation_rate:cancellation[0].cancellation_rate,
                top_region:topRegion.ship_state,
                top_region_sales:topRegion.total,
                top_sellers:topSellers,
                
            }
        };


    } catch(error) {

        context.log(error);
        context.res= {
            status:500,
            headers: {
                "Content-Type": "application/json"
            },
            body:{
                error: error.message
            }
        };

    }
};