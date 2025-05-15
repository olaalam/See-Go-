import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import HeaderInvoiceImage from "@/assets/HeaderInvoice.png";
import FooterInvoiceImage from "@/assets/FooterInvoice.png";
import { Badge } from "@/components/ui/badge";

export default function InvoiceCard() {
  return (
    <div className="!pb-20 ">
      <Card className="max-w-lg max-h-[100vh] !pb-10 !my-10 !m-auto border-none shadow-lg rounded-lg overflow-hidden  ">
        <CardHeader
          className="text-start relative !py-10 !pe-5"
          style={{
            backgroundImage: `url(${HeaderInvoiceImage})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            color: "white",
          }}
        >
          <h1 className="text-3xl bg-white top-10 left-4 absolute rounded-[10px] !px-6 !py-4 font-semibold text-bg-primary">
            Sea Go
          </h1>
        </CardHeader>

        <CardContent className="!px-10 !py-2">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <Badge
                variant="outline"
                className={`!px-3 !mb-2 !py-1 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 `}
              >
                Invoice to:
              </Badge>
              <p className="font-medium">Mauro Sicard</p>
              <p>1234 Bay Area Blvd</p>
              <p>Palo Alto, San Francisco, CA 94022</p>
              <p>Contact: mauro.sicard@gmail.com</p>
            </div>
            <div className="text-right">
              <Badge
                variant="outline"
                className={`!px-3 !mb-2 !py-1 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 `}
              >
                Date:
              </Badge>
              <p className="font-medium"> June 28, 2024</p>
              <p>BPX Agency</p>
              <p>1234 Bay Area Blvd</p>
              <p>Palo Alto, San Francisco, CA 94022</p>
            </div>
            <div >
              <Badge
                variant="outline"
                className={`!px-3 !mb-2 !py-1 cursor-pointer border-none rounded-[10px] text-blue-400 bg-blue-100 `}
              >
                Invoice number:
              </Badge>
              <p className="font-medium  !px-3">
                N: 000027
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>Village Name</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Renewal Date</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Amount (EGP)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Al Nour</TableCell>
                <TableCell>North Zone</TableCell>
                <TableCell>2025-05-01</TableCell>
                <TableCell>Gold</TableCell>
                <TableCell>$1,200.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <div className="flex justify-end mt-4 mb-6">
            <div className="text-right space-y-1">
              <p>
                <strong>Subtotal:</strong> $1,500.00
              </p>
              <p>
                <strong>Discount (Special Offer):</strong> -$300.00
              </p>
              <p>
                <strong>TAX:</strong> $50.00
              </p>
              <p className="text-lg font-semibold">
                <strong>Invoice Total:</strong> $1,250.00
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Terms & Conditions: This agreement is subject to the terms of the
            contract or agreement prior to the commencement of the design work.
            We reserve the right to suspend work in the event of non-payment.
          </p>
        </CardContent>

        <CardFooter
          className="text-start !p-8  "
          style={{
            backgroundImage: `url(${FooterInvoiceImage})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            color: "white",
          }}
        ></CardFooter>
      </Card>
    </div>
  );
}
