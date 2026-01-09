import 'package:flutter/material.dart';

class ChartBackgroundPainter extends CustomPainter {
  final Color color;
  final bool isNegative;

  ChartBackgroundPainter({required this.color, this.isNegative = false});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    
    // Draw a random looking sparkline curve
    if (isNegative) {
       // Downward trend look
       path.moveTo(0, size.height * 0.4);
       path.quadraticBezierTo(size.width * 0.25, size.height * 0.3, size.width * 0.5, size.height * 0.6);
       path.quadraticBezierTo(size.width * 0.75, size.height * 0.8, size.width, size.height * 0.7);
    } else {
       // Upward trend look
       path.moveTo(0, size.height * 0.7);
       path.quadraticBezierTo(size.width * 0.25, size.height * 0.8, size.width * 0.5, size.height * 0.5);
       path.quadraticBezierTo(size.width * 0.75, size.height * 0.3, size.width, size.height * 0.4);
    }

    // Add a fill gradient
    final fillPaint = Paint()
      ..style = PaintingStyle.fill
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          color.withOpacity(0.5),
          color.withOpacity(0.0),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final pathFill = Path.from(path);
    pathFill.lineTo(size.width, size.height);
    pathFill.lineTo(0, size.height);
    pathFill.close();

    canvas.drawPath(pathFill, fillPaint);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
