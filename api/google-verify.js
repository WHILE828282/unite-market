/* GET /googlefdb8731b0b5518bf.html (rewritten here in vercel.json) -> Google Search Console ownership token.
   Served by a function because cleanUrls would redirect a real .html file. Keep it while the site is in Search Console. */
export default function handler(req, res) {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send("google-site-verification: googlefdb8731b0b5518bf.html");
}
