/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Link from 'next/link';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';
import { formatDate } from '../../utils/formatDate';
import Comments from '../../components/Comments';

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date?: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  nextPost?: Post | null;
  previousPost?: Post | null;
  preview?: boolean;
}

export default function Post({
  post,
  previousPost,
  nextPost,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  const estimatedReadingTime = Math.ceil(
    post.data.content.reduce((acc, { heading, body }) => {
      const allText = `${heading} ${RichText.asText(body)}`;
      const numberOfWords = allText.split(/\s/).length;
      return acc + numberOfWords;
    }, 0) / 200
  );

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div style={{ backgroundImage: `url(${post.data.banner.url})` }} />
        <main className={`${commonStyles.content} ${styles.content}`}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.postMetaData}>
            <span>
              <FiCalendar />
              <time>{formatDate(post.first_publication_date)}</time>
            </span>
            <span>
              <FiUser />
              {post.data.author}
            </span>
            <span>
              <FiClock />
              {estimatedReadingTime} min
            </span>
          </div>
          {post.last_publication_date &&
            post.last_publication_date !== post.first_publication_date && (
              <div className={styles.editDate}>
                * editado em{' '}
                {formatDate(post.last_publication_date, "d MMM y', ??s' H:mm")}
              </div>
            )}
          <article>
            {post.data.content.map(({ heading, body }) => {
              const contentKey =
                heading.replace(/\s/g, '-').slice(0, 20) + post.uid;

              return (
                <div key={contentKey}>
                  <h2>{heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(body),
                    }}
                  />
                </div>
              );
            })}
          </article>
          <hr />
          <footer>
            {previousPost && (
              <div>
                <span>{previousPost.data.title}</span>
                <Link href={previousPost.uid}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}
            {nextPost && (
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <span>{nextPost.data.title}</span>
                <Link href={nextPost.uid}>
                  <a>Pr??ximo post</a>
                </Link>
              </div>
            )}
          </footer>
          <Comments />
        </main>
      </div>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a className={commonStyles.exitPreviewLink}>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 5,
    }
  );

  const paths = posts.results.map(post => ({
    params: {
      slug: post.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData = {},
}) => {
  const { slug } = params;

  const post = await getPrismicClient().getByUID('post', String(slug), {
    fetch: ['post.title', 'post.author', 'post.banner', 'post.content'],
    ref: previewData.ref ?? null,
  });

  const previousPostReponse = await getPrismicClient().query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.first_publication_date desc]',
      ref: previewData.ref ?? null,
    }
  );

  const nextPostReponse = await getPrismicClient().query(
    Prismic.Predicates.at('document.type', 'post'),
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.first_publication_date]',
      ref: previewData.ref ?? null,
    }
  );

  return {
    props: {
      post,
      previousPost: previousPostReponse.results[0] ?? null,
      nextPost: nextPostReponse.results[0] ?? null,
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
