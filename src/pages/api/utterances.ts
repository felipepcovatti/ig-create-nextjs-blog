import { NextApiRequest, NextApiResponse } from 'next';

export default (req: NextApiRequest, res: NextApiResponse): void => {
  const { repo, theme } = req.query;
  res.status(200).json({
    repo: repo ?? process.env.UTTERANCES_COMMENTS_GITHUB_REPO,
    theme: theme ?? 'github-dark',
    src: 'https://utteranc.es/client.js',
    'issue-term': 'pathname',
    crossorigin: 'anonymous',
    async: true,
  });
  res.end();
};
