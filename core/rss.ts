import Parser from "rss-parser";
const parser = new Parser();

export async function getNews() {
  const feed = await parser.parseURL("https://g1.globo.com/rss/g1/");
  return feed.items.map(i => ({
    title: i.title,
    link: i.link
  }));
}
