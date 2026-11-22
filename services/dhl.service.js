const https = require('https');
const http = require('http');
const { URL } = require('url');
const { secret } = require('../config/secret');

function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sendSoapRequest(action, xmlBody) {
  return new Promise((resolve, reject) => {
    const serviceUrl = new URL(secret.dhl_service_url);
    const isHttps = serviceUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const postData = Buffer.from(xmlBody, 'utf-8');

    const options = {
      hostname: serviceUrl.hostname,
      port: serviceUrl.port || (isHttps ? 443 : 80),
      path: serviceUrl.pathname + (serviceUrl.search || ''),
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"http://tempuri.org/IDHLService/${action}"`,
        'Content-Length': postData.length,
        'User-Agent': 'BMJewels-DHL-Integration/1.0',
      },
      rejectUnauthorized: false,
      timeout: 30000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('DHL API request timed out'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

function extractResultContent(responseBody, resultTagName) {
  const reg = new RegExp(`<${resultTagName}[^>]*>([\\s\\S]*?)<\\/${resultTagName}>`, 'i');
  const match = responseBody.match(reg);
  if (!match) return '';

  let content = match[1];
  // Unescape standard XML entities if present
  content = content
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&');

  // Strip CDATA wrapper if present
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return content.trim();
}

/**
 * 1. Calculate Shipping Quote with Remote Area Surcharge (RAS)
 */
async function quoteShipment(params = {}) {
  const shipperPostCode = params.shipperPostCode || secret.dhl_shipper_postal_code || '380015';
  const receiverCountryCode = params.receiverCountryCode || 'US';
  const postCode = params.postCode || '10018';
  const fromCity = params.fromCity || secret.dhl_shipper_city || 'AHMEDABAD';
  const toCity = params.toCity || 'NEW YORK';
  const declaredCurrency = params.declaredCurrency || 'USD';
  const declaredValue = params.declaredValue || '100';
  const pieces = Number(params.pieces) || 1;
  const shipPieceWt = params.weight || '0.5';
  const shipPieceDepth = params.depth || '10';
  const shipPieceWidth = params.width || '10';
  const shipPieceHeight = params.height || '10';

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:PostQuote_RAS>
      <tem:ShipperPostCode>${escapeXml(shipperPostCode)}</tem:ShipperPostCode>
      <tem:ReceiverCountryCode>${escapeXml(receiverCountryCode)}</tem:ReceiverCountryCode>
      <tem:PostCode>${escapeXml(postCode)}</tem:PostCode>
      <tem:fromCity>${escapeXml(fromCity)}</tem:fromCity>
      <tem:IsDutiable>Y</tem:IsDutiable>
      <tem:PickupHours>14</tem:PickupHours>
      <tem:PickupMinutes>30</tem:PickupMinutes>
      <tem:DeclaredCurrency>${escapeXml(declaredCurrency)}</tem:DeclaredCurrency>
      <tem:DeclaredValue>${escapeXml(declaredValue)}</tem:DeclaredValue>
      <tem:NetworkTypeCode>AL</tem:NetworkTypeCode>
      <tem:GlobalProductCode>P</tem:GlobalProductCode>
      <tem:LocalProductCode>P</tem:LocalProductCode>
      <tem:toCity>${escapeXml(toCity)}</tem:toCity>
      <tem:PaymentAccountNumber>${escapeXml(secret.dhl_account_number)}</tem:PaymentAccountNumber>
      <tem:pieces>${pieces}</tem:pieces>
      <tem:ShipPieceWt>${escapeXml(shipPieceWt)}</tem:ShipPieceWt>
      <tem:ShipPieceDepth>${escapeXml(shipPieceDepth)}</tem:ShipPieceDepth>
      <tem:ShipPieceWidth>${escapeXml(shipPieceWidth)}</tem:ShipPieceWidth>
      <tem:ShipPieceHeight>${escapeXml(shipPieceHeight)}</tem:ShipPieceHeight>
    </tem:PostQuote_RAS>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await sendSoapRequest('PostQuote_RAS', xml);
  const resultStr = extractResultContent(res.body, 'PostQuote_RASResult');

  const shippingChargeMatch = resultStr.match(/<ShippingCharge>([\s\S]*?)<\/ShippingCharge>/i);
  const rasMatch = resultStr.match(/<RemoteAreaSurcharge>([\s\S]*?)<\/RemoteAreaSurcharge>/i);
  const taxMatch = resultStr.match(/<TotalTaxAmount>([\s\S]*?)<\/TotalTaxAmount>/i);

  const shippingCharge = shippingChargeMatch ? parseFloat(shippingChargeMatch[1]) : 0;
  const remoteAreaSurcharge = rasMatch ? parseFloat(rasMatch[1]) : 0;
  const totalTaxAmount = taxMatch ? parseFloat(taxMatch[1]) : 0;

  return {
    success: shippingCharge > 0,
    shippingCharge,
    remoteAreaSurcharge,
    totalTaxAmount,
    totalAmount: shippingCharge,
    currency: 'INR',
    rawResult: resultStr,
  };
}

/**
 * 2. Create CSB-V Shipment for Fine Jewellery
 */
async function createShipmentCSBV(order, options = {}) {
  const consigneeName = (options.consigneeName || order.name || 'Valued Customer').substring(0, 35);
  const consigneeCompName = (options.consigneeCompName || order.company || consigneeName).substring(0, 60);

  const rawAddress = options.address || order.address || (order.shippingInfo && order.shippingInfo.address) || '';
  const addrParts = rawAddress.split(/,|\n/).map(s => s.trim()).filter(Boolean);
  const addLine1 = (addrParts[0] || rawAddress || 'Customer Address 1').substring(0, 45);
  const addLine2 = (addrParts[1] || 'Address Line 2').substring(0, 45);
  const addLine3 = (addrParts.slice(2).join(' ') || 'Address Line 3').substring(0, 45);

  const consigneeCity = (options.city || order.city || (order.shippingInfo && order.shippingInfo.city) || 'NEW YORK').toUpperCase().substring(0, 35);
  const postalCode = (options.zipCode || order.zipCode || (order.shippingInfo && (order.shippingInfo.pincode || order.shippingInfo.pinCode)) || '10018').trim();
  const consigneeCountryCode = (options.countryCode || order.countryCode || 'US').toUpperCase().substring(0, 2);
  const consigneeCountryName = (options.countryName || order.country || 'UNITED STATES OF AMERICA').toUpperCase();
  const consigneeDivCode = consigneeCountryCode === 'US' ? (options.divisionCode || 'NY').toUpperCase().substring(0, 2) : '';
  const consigneePh = (options.contact || order.contact || order.mobile || '9999999999').replace(/[^0-9]/g, '').substring(0, 15) || '9999999999';
  const consigneeEmail = options.email || order.email || 'customer@example.com';

  const orderItems = (order.cart && order.cart.length > 0) ? order.cart : [
    {
      product_name: 'FINE GOLD JEWELLERY',
      orderQuantity: 1,
      price: order.totalAmount || 100,
    }
  ];

  const count = orderItems.length;
  const serialNumbers = [];
  const fobValues = [];
  const discounts = [];
  const descriptions = [];
  const qtys = [];
  const weights = [];
  const hsCodes = [];
  const commodityCodes = [];
  const commodityTypes = [];
  const ratesPerUnit = [];
  const uoms = [];
  const cesses = [];
  const igstPercents = [];
  const igsts = [];
  const taxables = [];
  const mfgCodes = [];
  const mfgNames = [];
  const skus = [];
  const jewelleryTypes = [];
  const purities = [];
  const jewelWeights = [];
  const isStuddedList = [];
  const stoneNames = [];
  const diamondCuts = [];
  const diamondColors = [];
  const diamondClarities = [];
  const diamondCarats = [];
  const diamondStones = [];

  const hsnCode = options.hsnCode || secret.dhl_default_hsn || '71131990';
  const commodityCode = hsnCode + '00';
  const declaredCurrency = options.currency || 'USD';

  let totalDeclared = 0;
  orderItems.forEach((item, idx) => {
    serialNumbers.push(idx + 1);
    const qty = Number(item.orderQuantity) || 1;
    qtys.push(qty);
    const unitPrice = Number(item.price) || Math.round((order.totalAmount || 100) / count);
    ratesPerUnit.push(unitPrice);
    const itemTotal = unitPrice * qty;
    fobValues.push(itemTotal);
    taxables.push(itemTotal);
    totalDeclared += itemTotal;
    discounts.push(0);

    const desc = (item.title || item.product_name || 'FINE GOLD JEWELLERY').toUpperCase().replace(/[^A-Z0-9 ]/g, '').substring(0, 45);
    descriptions.push(desc || 'FINE GOLD JEWELLERY');

    const itmWt = (parseFloat(item.weight) || 0.05).toFixed(3);
    weights.push(itmWt);
    hsCodes.push(hsnCode);
    commodityCodes.push(commodityCode);
    commodityTypes.push('OTHERS');
    uoms.push('PCS');
    cesses.push(0);
    igstPercents.push(0);
    igsts.push(0);
    mfgCodes.push('IN');
    mfgNames.push('INDIA');
    skus.push(item.sku || `SKU-${order._id ? order._id.toString().slice(-6) : '001'}-${idx + 1}`);
    jewelleryTypes.push('GOLD');
    purities.push('6-24');
    jewelWeights.push(itmWt);
    isStuddedList.push(item.isStudded ? 'YES' : 'NO');
    stoneNames.push(item.isStudded ? 'DIAMOND' : '0');
    diamondCuts.push(item.diamondCut || 'Brilliant');
    diamondColors.push(item.diamondColor || 'G');
    diamondClarities.push(item.diamondClarity || 'VS1');
    diamondCarats.push(item.diamondCarat || 0.1);
    diamondStones.push(item.diamondNoOfStones || 1);
  });

  const now = new Date();
  const invoiceDateStr = now.toISOString().split('T')[0];
  const invoiceNum = order.invoice ? String(order.invoice) : (order._id ? String(order._id).slice(-8) : String(Date.now()).slice(-8));
  const orderRef = order._id ? `ORD-${String(order._id).slice(-8).toUpperCase()}` : `REF-${Date.now()}`;
  const totalBoxWeight = options.weight || '0.5';

  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/" xmlns:dhl="http://schemas.datacontract.org/2004/07/DHLWCFService.App_Code">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:PostShipment_CSBV>
      <tem:Shipmentpurpose>CSBV</tem:Shipmentpurpose>
      <tem:ShipperAccNumber>${escapeXml(secret.dhl_account_number)}</tem:ShipperAccNumber>
      <tem:ShippingPaymentType>S</tem:ShippingPaymentType>
      <tem:BillingAccNumber>${escapeXml(secret.dhl_account_number)}</tem:BillingAccNumber>
      <tem:ConsigneeCompName>${escapeXml(consigneeCompName)}</tem:ConsigneeCompName>
      <tem:ConsigneeAddLine1>${escapeXml(addLine1)}</tem:ConsigneeAddLine1>
      <tem:ConsigneeAddLine2>${escapeXml(addLine2)}</tem:ConsigneeAddLine2>
      <tem:ConsigneeAddLine3>${escapeXml(addLine3)}</tem:ConsigneeAddLine3>
      <tem:ConsigneeCity>${escapeXml(consigneeCity)}</tem:ConsigneeCity>
      <tem:ConsigneeDivCode>${escapeXml(consigneeDivCode)}</tem:ConsigneeDivCode>
      <tem:PostalCode>${escapeXml(postalCode)}</tem:PostalCode>
      <tem:ConsigneeCountryCode>${escapeXml(consigneeCountryCode)}</tem:ConsigneeCountryCode>
      <tem:ConsigneeCountryName>${escapeXml(consigneeCountryName)}</tem:ConsigneeCountryName>
      <tem:ConsigneeName>${escapeXml(consigneeName)}</tem:ConsigneeName>
      <tem:ConsigneePh>${escapeXml(consigneePh)}</tem:ConsigneePh>
      <tem:ConsigneeEmail>${escapeXml(consigneeEmail)}</tem:ConsigneeEmail>
      <tem:RegistrationNumber></tem:RegistrationNumber>
      <tem:RegistrationNumberTypeCode></tem:RegistrationNumberTypeCode>
      <tem:RegistrationNumberIssuerCountryCode></tem:RegistrationNumberIssuerCountryCode>
      <tem:BusinessPartyTypeCode></tem:BusinessPartyTypeCode>
      <tem:DutiableDeclaredvalue>${options.declaredValue || totalDeclared}</tem:DutiableDeclaredvalue>
      <tem:DutiableDeclaredCurrency>${escapeXml(declaredCurrency)}</tem:DutiableDeclaredCurrency>
      <tem:ShipNumberOfPieces>1</tem:ShipNumberOfPieces>
      <tem:ShipCurrencyCode>${escapeXml(declaredCurrency)}</tem:ShipCurrencyCode>
      <tem:ShipPieceWt>${escapeXml(totalBoxWeight)}</tem:ShipPieceWt>
      <tem:ShipPieceDepth>${escapeXml(options.depth || '10')}</tem:ShipPieceDepth>
      <tem:ShipPieceWidth>${escapeXml(options.width || '10')}</tem:ShipPieceWidth>
      <tem:ShipPieceHeight>${escapeXml(options.height || '10')}</tem:ShipPieceHeight>
      <tem:ShipGlobalProductCode>P</tem:ShipGlobalProductCode>
      <tem:ShipLocalProductCode>P</tem:ShipLocalProductCode>
      <tem:ShipContents>FINE GOLD JEWELLERY</tem:ShipContents>
      <tem:ShipperId>${escapeXml(secret.dhl_account_number)}</tem:ShipperId>
      <tem:ShipperCompName>${escapeXml(secret.dhl_company_name)}</tem:ShipperCompName>
      <tem:ShipperAddress1>${escapeXml(secret.dhl_shipper_address1)}</tem:ShipperAddress1>
      <tem:ShipperAddress2>${escapeXml(secret.dhl_shipper_address2)}</tem:ShipperAddress2>
      <tem:ShipperAddress3>${escapeXml(secret.dhl_shipper_address3)}</tem:ShipperAddress3>
      <tem:ShipperCountryCode>${escapeXml(secret.dhl_shipper_country_code)}</tem:ShipperCountryCode>
      <tem:ShipperCountryName>${escapeXml(secret.dhl_shipper_country_name)}</tem:ShipperCountryName>
      <tem:ShipperCity>${escapeXml(secret.dhl_shipper_city)}</tem:ShipperCity>
      <tem:ShipperPostalCode>${escapeXml(secret.dhl_shipper_postal_code)}</tem:ShipperPostalCode>
      <tem:ShipperPhoneNumber>${escapeXml(secret.dhl_contact_number)}</tem:ShipperPhoneNumber>
      <tem:SiteId>${escapeXml(secret.dhl_site_id)}</tem:SiteId>
      <tem:Password>${escapeXml(secret.dhl_password)}</tem:Password>
      <tem:ShipperName>${escapeXml(secret.dhl_contact_name)}</tem:ShipperName>
      <tem:ShipperRef>${escapeXml(orderRef)}</tem:ShipperRef>
      <tem:ShipperRegistrationNumber></tem:ShipperRegistrationNumber>
      <tem:ShipperRegistrationNumberTypeCode></tem:ShipperRegistrationNumberTypeCode>
      <tem:ShipperRegistrationNumberIssuerCountryCode></tem:ShipperRegistrationNumberIssuerCountryCode>
      <tem:ShipperBusinessPartyTypeCode></tem:ShipperBusinessPartyTypeCode>
      <tem:BillToCompanyName></tem:BillToCompanyName>
      <tem:BillToContactName></tem:BillToContactName>
      <tem:BillToAddressLine1></tem:BillToAddressLine1>
      <tem:BillToCity></tem:BillToCity>
      <tem:BillToPostcode></tem:BillToPostcode>
      <tem:BillToSuburb></tem:BillToSuburb>
      <tem:BillToState></tem:BillToState>
      <tem:BillToCountryName></tem:BillToCountryName>
      <tem:BillToCountryCode></tem:BillToCountryCode>
      <tem:BillToPhoneNumber></tem:BillToPhoneNumber>
      <tem:IECNo>${escapeXml(secret.dhl_iec_no)}</tem:IECNo>
      <tem:TermsOfTrade>CIF</tem:TermsOfTrade>
      <tem:Usingecommerce>1</tem:Usingecommerce>
      <tem:IsUnderMEISScheme>0</tem:IsUnderMEISScheme>
      <tem:GSTIN>${escapeXml(secret.dhl_gstin)}</tem:GSTIN>
      <tem:GSTInvNo></tem:GSTInvNo>
      <tem:GSTInvNoDate></tem:GSTInvNoDate>
      <tem:NonGSTInvNo>${escapeXml(invoiceNum)}</tem:NonGSTInvNo>
      <tem:NonGSTInvDate>${escapeXml(invoiceDateStr)}</tem:NonGSTInvDate>
      <tem:IsUsingIGST>NO</tem:IsUsingIGST>
      <tem:UsingBondorUT>YES</tem:UsingBondorUT>
      <tem:BankADCode>${escapeXml(secret.dhl_bank_ad_code)}</tem:BankADCode>
      <tem:Exporter_CompanyName></tem:Exporter_CompanyName>
      <tem:Exporter_AddressLine1></tem:Exporter_AddressLine1>
      <tem:Exporter_AddressLine2></tem:Exporter_AddressLine2>
      <tem:Exporter_AddressLine3></tem:Exporter_AddressLine3>
      <tem:Exporter_City></tem:Exporter_City>
      <tem:Exporter_DivisionCode></tem:Exporter_DivisionCode>
      <tem:Exporter_PostalCode></tem:Exporter_PostalCode>
      <tem:Exporter_CountryCode></tem:Exporter_CountryCode>
      <tem:Exporter_CountryName></tem:Exporter_CountryName>
      <tem:Exporter_PersonName></tem:Exporter_PersonName>
      <tem:Exporter_PhoneNumber></tem:Exporter_PhoneNumber>
      <tem:Exporter_Email></tem:Exporter_Email>
      <tem:Exporter_RegistrationNumber></tem:Exporter_RegistrationNumber>
      <tem:Exporter_RegistrationNumberTypeCode></tem:Exporter_RegistrationNumberTypeCode>
      <tem:Exporter_RegistrationNumberIssuerCountryCode></tem:Exporter_RegistrationNumberIssuerCountryCode>
      <tem:Exporter_BusinessPartyTypeCode></tem:Exporter_BusinessPartyTypeCode>
      <tem:UseDHLInvoice>Y</tem:UseDHLInvoice>
      <tem:SignatureName>${escapeXml(secret.dhl_contact_name)}</tem:SignatureName>
      <tem:SignatureTitle>Authorised Signatory</tem:SignatureTitle>
      <tem:LicenseNumber></tem:LicenseNumber>
      <tem:ExpiryDate></tem:ExpiryDate>
      <tem:ManufactureCountryCode>${mfgCodes.join(',')}</tem:ManufactureCountryCode>
      <tem:ManufactureCountryName>${mfgNames.join(',')}</tem:ManufactureCountryName>
      <tem:SerialNumber>${serialNumbers.join(',')}</tem:SerialNumber>
      <tem:FOBValue>${fobValues.join(',')}</tem:FOBValue>
      <tem:Discount>${discounts.join(',')}</tem:Discount>
      <tem:Description>${descriptions.join(',')}</tem:Description>
      <tem:Qty>${qtys.join(',')}</tem:Qty>
      <tem:Weight>${weights.join(',')}</tem:Weight>
      <tem:HSCode>${hsCodes.join(',')}</tem:HSCode>
      <tem:CommodityCode>${commodityCodes.join(',')}</tem:CommodityCode>
      <tem:CommodityType>${commodityTypes.join(',')}</tem:CommodityType>
      <tem:InvoiceRatePerUnit>${ratesPerUnit.join(',')}</tem:InvoiceRatePerUnit>
      <tem:ShipPieceUOM>${uoms.join(',')}</tem:ShipPieceUOM>
      <tem:ShipPieceCESS>${cesses.join(',')}</tem:ShipPieceCESS>
      <tem:ShipPieceIGSTPercentage>${igstPercents.join(',')}</tem:ShipPieceIGSTPercentage>
      <tem:ShipPieceIGST>${igsts.join(',')}</tem:ShipPieceIGST>
      <tem:ShipPieceTaxableValue>${taxables.join(',')}</tem:ShipPieceTaxableValue>
      <tem:FreightCharge>0</tem:FreightCharge>
      <tem:InsuranceCharge>0</tem:InsuranceCharge>
      <tem:TotalIGST>0</tem:TotalIGST>
      <tem:CessCharge>0</tem:CessCharge>
      <tem:ReverseCharge>0</tem:ReverseCharge>
      <tem:PayerGSTVAT></tem:PayerGSTVAT>
      <tem:IsResponseRequired>Y</tem:IsResponseRequired>
      <tem:LabelReq>Y</tem:LabelReq>
      <tem:SpecialService>SX</tem:SpecialService>
      <tem:InsuredAmount>0</tem:InsuredAmount>
      <tem:Invoicevalueinword>ZERO</tem:Invoicevalueinword>
      <tem:Placeofsupply>${escapeXml(secret.dhl_shipper_city)}</tem:Placeofsupply>
      <tem:dateofsupply>${escapeXml(invoiceDateStr)}</tem:dateofsupply>
      <tem:Shipperstatecode>${escapeXml(secret.dhl_shipper_state_code)}</tem:Shipperstatecode>
      <tem:ShipperstateName>${escapeXml(secret.dhl_shipper_state)}</tem:ShipperstateName>
      <tem:isIndemnityClauseRead>YES</tem:isIndemnityClauseRead>
      <tem:ACCOUNT_NO>${escapeXml(secret.dhl_account_number)}</tem:ACCOUNT_NO>
      <tem:NFEI_FLAG>NO</tem:NFEI_FLAG>
      <tem:GOV_NONGOV_TYPE>P</tem:GOV_NONGOV_TYPE>
      <tem:Destination_Duty_VAT_Charges>0</tem:Destination_Duty_VAT_Charges>
      <tem:CustomerBarcodeCode></tem:CustomerBarcodeCode>
      <tem:CustomerBarcodeText></tem:CustomerBarcodeText>
      <tem:plt_signature></tem:plt_signature>
      <tem:DutyAccountNumber></tem:DutyAccountNumber>
      <tem:plt_signature_Base64></tem:plt_signature_Base64>
      <tem:WebsiteOrEcomOperatorName>www.bmjewels.com</tem:WebsiteOrEcomOperatorName>
      <tem:PaymentorTxnID>${escapeXml(order.paymentIntent?.id || orderRef)}</tem:PaymentorTxnID>
      <tem:OrderNumber>${escapeXml(orderRef)}</tem:OrderNumber>
      <tem:OrderDate>${escapeXml(invoiceDateStr)}</tem:OrderDate>
      <tem:SKU_Number>${skus.join(',')}</tem:SKU_Number>
      <tem:JewelleryType>${jewelleryTypes.join(',')}</tem:JewelleryType>
      <tem:GnJ_Reimport_Availed>NO</tem:GnJ_Reimport_Availed>
      <tem:AdditionalDataElements>
        <dhl:JewelleryPurity>${purities.join(',')}</dhl:JewelleryPurity>
        <dhl:JewelleryWeight>${jewelWeights.join(',')}</dhl:JewelleryWeight>
        <dhl:IsJewelleryStudded>${isStuddedList.join(',')}</dhl:IsJewelleryStudded>
        <dhl:NameofStuddedStone>${stoneNames.join(',')}</dhl:NameofStuddedStone>
        <dhl:JewelleryCertificateInfo></dhl:JewelleryCertificateInfo>
        <dhl:DiamondCut>${diamondCuts.join(',')}</dhl:DiamondCut>
        <dhl:DiamondColor>${diamondColors.join(',')}</dhl:DiamondColor>
        <dhl:DiamondClarity>${diamondClarities.join(',')}</dhl:DiamondClarity>
        <dhl:DiamondCarat>${diamondCarats.join(',')}</dhl:DiamondCarat>
        <dhl:DiamondNoOfStones>${diamondStones.join(',')}</dhl:DiamondNoOfStones>
        <dhl:NameOfTheStone></dhl:NameOfTheStone>
        <dhl:NaturalSynthetic></dhl:NaturalSynthetic>
        <dhl:NoOfStones></dhl:NoOfStones>
        <dhl:StoneCountry></dhl:StoneCountry>
      </tem:AdditionalDataElements>
    </tem:PostShipment_CSBV>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await sendSoapRequest('PostShipment_CSBV', xml);
  const resultStr = extractResultContent(res.body, 'PostShipment_CSBVResult');

  // Check for error ConditionData
  const conditionMatch = resultStr.match(/<ConditionData>([\s\S]*?)<\/ConditionData>/i);
  if (conditionMatch) {
    const errorMsg = conditionMatch[1].trim();
    return {
      success: false,
      message: errorMsg,
      rawResponse: resultStr,
    };
  }

  // Check for success URL format:
  // e.g.: https://www.dhlindiaplugin.com/FileUpload/7443575156_JD014600012865092785.pdf ; Invoice Path :https://www.dhlindiaplugin.com/FileUpload/Invoice/CSB-V/Invoice_7443575156.pdf ; PLTShipment :No
  let labelUrl = '';
  let invoiceUrl = '';
  let awbNumber = '';
  let pieceBarcode = '';

  const pdfMatches = resultStr.match(/(https?:\/\/[^\s;]+?\.pdf)/gi);
  if (pdfMatches && pdfMatches.length > 0) {
    labelUrl = pdfMatches[0];
    if (pdfMatches.length > 1) {
      invoiceUrl = pdfMatches[1];
    }

    // Extract AWB from filename e.g. 7443575156_JD014600012865092785.pdf
    const awbMatch = labelUrl.match(/\/(\d{10})_([A-Za-z0-9]+)\.pdf/);
    if (awbMatch) {
      awbNumber = awbMatch[1];
      pieceBarcode = awbMatch[2];
    } else {
      const anyDigits = labelUrl.match(/\/(\d{10})/);
      if (anyDigits) awbNumber = anyDigits[1];
    }
  }

  if (awbNumber) {
    return {
      success: true,
      awbNumber,
      labelUrl,
      invoiceUrl,
      pieceBarcode,
      rawResponse: resultStr,
    };
  }

  // Fallback check if AWB is in text
  const awbGenericMatch = resultStr.match(/\b\d{10}\b/);
  if (awbGenericMatch) {
    return {
      success: true,
      awbNumber: awbGenericMatch[0],
      labelUrl,
      invoiceUrl,
      rawResponse: resultStr,
    };
  }

  return {
    success: false,
    message: resultStr || 'Unknown response from DHL webservice',
    rawResponse: resultStr,
  };
}

/**
 * 3. Track Shipment Status (PostTracking)
 */
async function trackShipment(awbNumber) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:PostTracking>
      <tem:awbnumber>${escapeXml(awbNumber)}</tem:awbnumber>
    </tem:PostTracking>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await sendSoapRequest('PostTracking', xml);
  const resultStr = extractResultContent(res.body, 'PostTrackingResult');

  return {
    success: true,
    awbNumber,
    rawResult: resultStr,
  };
}

/**
 * 4. Track All Checkpoints (PostTracking_AllCheckpoint)
 */
async function trackShipmentAllCheckpoints(awbNumber) {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tem="http://tempuri.org/">
  <soapenv:Header/>
  <soapenv:Body>
    <tem:PostTracking_AllCheckpoint>
      <tem:awbnumber>${escapeXml(awbNumber)}</tem:awbnumber>
    </tem:PostTracking_AllCheckpoint>
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await sendSoapRequest('PostTracking_AllCheckpoint', xml);
  const resultStr = extractResultContent(res.body, 'PostTracking_AllCheckpointResult');

  // Parse checkpoints inside result XML
  const checkpoints = [];
  const eventRegex = /<(?:ShipmentEvent|Event|Checkpoint)>([\s\S]*?)<\/(?:ShipmentEvent|Event|Checkpoint)>/gi;
  let eventMatch;

  while ((eventMatch = eventRegex.exec(resultStr)) !== null) {
    const itemXml = eventMatch[1];
    const dateM = itemXml.match(/<(?:EventDate|Date)>([^<]+)<\//i);
    const timeM = itemXml.match(/<(?:EventTime|Time)>([^<]+)<\//i);
    const descM = itemXml.match(/<(?:EventDescription|Description|Status)>([^<]+)<\//i);
    const locM = itemXml.match(/<(?:ServiceArea|Location|City)>([^<]+)<\//i);
    const codeM = itemXml.match(/<(?:EventCode|Code)>([^<]+)<\//i);

    checkpoints.push({
      date: dateM ? dateM[1].trim() : '',
      time: timeM ? timeM[1].trim() : '',
      description: descM ? descM[1].trim() : '',
      location: locM ? locM[1].trim() : '',
      code: codeM ? codeM[1].trim() : '',
    });
  }

  // If no structured event tags, extract action status or check if empty
  const actionStatusMatch = resultStr.match(/<ActionStatus>([^<]+)<\/ActionStatus>/i);
  const statusMsg = actionStatusMatch ? actionStatusMatch[1].trim() : (checkpoints.length > 0 ? 'In Transit' : 'Shipment Created / Awaiting Pickup');

  return {
    success: true,
    awbNumber,
    status: statusMsg,
    checkpoints,
    rawResult: resultStr,
  };
}

module.exports = {
  quoteShipment,
  createShipmentCSBV,
  trackShipment,
  trackShipmentAllCheckpoints,
};
