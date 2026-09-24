import { Anchor, Table, Text, Title } from '@mantine/core';
import { plainText } from '../services/catalog';

function Expiry({ value }) {
  if (value === null || value === '') return 'Never';
  // Preserve Woo's calendar date instead of shifting midnight to the previous
  // day in a customer's timezone. Missing metadata must not imply unlimited access.
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return 'See purchase email';
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'See purchase email';
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)}
    </time>
  );
}

export default function OrderDownloads({ downloads, items }) {
  return (
    <section aria-labelledby="order-downloads-heading">
      <Title id="order-downloads-heading" order={2} size="h5" mb="sm">
        Downloads
      </Title>
      {downloads.length ? (
        <Table
          aria-label="Purchased downloads"
          fz="sm"
          verticalSpacing="sm"
          horizontalSpacing={0}
          style={{ tableLayout: 'fixed', width: '100%' }}
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" style={{ width: '65%' }}>
                Product
              </Table.Th>
              <Table.Th scope="col">Expires</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {downloads.map((file, index) => {
              const product = items.find((item) => String(item.id) === String(file.productId));
              const title = plainText(product?.name || file.productName || file.name);
              const siblings = downloads.filter((entry) => entry.productId === file.productId);
              const position = siblings.indexOf(file) + 1;
              return (
                <Table.Tr key={`${file.productId}:${file.downloadId || index}`}>
                  <Table.Td style={{ paddingRight: 16, verticalAlign: 'top' }}>
                    <Anchor
                      href={file.url}
                      size="sm"
                      underline="always"
                      referrerPolicy="no-referrer"
                      aria-label={
                        siblings.length > 1
                          ? `${title} (file ${position} of ${siblings.length})`
                          : title
                      }
                    >
                      {title}
                    </Anchor>
                    {siblings.length > 1 && (
                      <Text size="xs" c="dimmed">
                        File {position} of {siblings.length}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ verticalAlign: 'top' }}>
                    <Expiry value={file.expires} />
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      ) : (
        <Text size="sm">
          Check your purchase email for delivery details, or contact us if a download is missing.
        </Text>
      )}
    </section>
  );
}
