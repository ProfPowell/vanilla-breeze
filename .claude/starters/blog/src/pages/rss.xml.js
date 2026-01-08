import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft))
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: '{{BLOG_NAME}}',
    description: '{{DESCRIPTION}}',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/blog/${post.slug}/`,
      categories: post.data.tags,
      author: '{{AUTHOR_EMAIL}} ({{AUTHOR_NAME}})',
    })),
    customData: `<language>en-us</language>`,
  });
}