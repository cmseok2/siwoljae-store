const GOOGLE_SCRIPT_URL="https://script.google.com/macros/s/AKfycbydZo8zQ-V7dF_zzF27sieHzLMbCcONVHKdAZN6AArZDGpIejr1s_dkqdpGmf966M-j/exec";

export async function POST(request:Request){
 try{
  const data=await request.json();
  if(!data.name||!data.birthDate||!data.birthTime||!data.gender||!data.phone||!data.privacy){
   return Response.json({message:"필수 정보를 확인해주세요."},{status:400});
  }
  const initialResponse=await fetch(GOOGLE_SCRIPT_URL,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name:String(data.name).trim(),birthDate:String(data.birthDate),birthTime:String(data.birthTime).trim(),gender:String(data.gender),phone:String(data.phone).trim(),product:String(data.product||""),message:String(data.message||"").trim()}),redirect:"manual"});
  const redirectUrl=initialResponse.headers.get("location");
  const response=redirectUrl?await fetch(redirectUrl,{method:"GET"}):initialResponse;
  if(!response.ok)throw new Error("Google Sheets request failed");
  const result=await response.json();
  if(result?.success!==true||!Number.isInteger(result?.savedRow))throw new Error("Google Sheets did not confirm the saved row");
  return Response.json({success:true,savedRow:result.savedRow});
 }catch{
  return Response.json({message:"상담 정보를 저장하지 못했습니다."},{status:502});
 }
}
