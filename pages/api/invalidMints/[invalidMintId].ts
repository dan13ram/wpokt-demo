import { NextApiRequest, NextApiResponse } from 'next';

import { getInvalidMintFromId } from '@/lib/invalidMint';

const getInvalidMint = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') return res.status(405).end();

  const { invalidMintId } = req.query;

  if (typeof invalidMintId !== 'string' || !invalidMintId)
    return res.status(400).end();

  try {
    const invalidMint = getInvalidMintFromId(invalidMintId);

    if (!invalidMint) return res.status(204).end();

    return res.status(200).json(invalidMint);
  } catch (error) {
    console.error('Error finding invalidMint:', error);
    return res.status(500).end();
  }
};

export default getInvalidMint;
